import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from jose import jwt, JWTError

from app.core.config import settings
from app.core.events import manager
from app.database.session import SessionLocal
from app.models.models import User

logger = logging.getLogger("yurae.websocket_api")

router = APIRouter(tags=["Realtime WebSockets"])

def authenticate_ws_token(token: str) -> tuple[bool, dict]:
    """Decodes and validates JWT token for WebSocket connection handshakes."""
    if not token:
        return False, {}
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return True, payload
    except JWTError:
        return False, {}


@router.websocket("/ws/admin")
async def websocket_admin_endpoint(
    websocket: WebSocket,
    token: str = Query(None)
):
    """
    Realtime WebSocket channel for Yurae Admin Operations Center.
    Pushes instantaneous order updates, payments, low stock alerts, support messages, and fulfillment progress.
    """
    # Verify Authentication
    is_valid, payload = authenticate_ws_token(token)
    if not is_valid:
        logger.warning("[WS Admin] Connection rejected: Invalid or missing token")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = payload.get("sub")
    role = payload.get("role", "CUSTOMER")

    # Verify admin role in DB
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user or user.role != "ADMIN":
            logger.warning(f"[WS Admin] Connection rejected: User {user_id} is not an ADMIN")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    finally:
        db.close()

    await manager.connect_admin(websocket)

    # Send Welcome / Connected confirmation frame
    try:
        await websocket.send_json({
            "event": "CONNECTED",
            "channel": "admin",
            "message": "Connected to Yurae Live Operations Stream",
            "admin_user": f"{user.first_name} {user.last_name}"
        })
    except Exception:
        pass

    try:
        while True:
            # Handle incoming ping / messages from admin client
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
            elif data == "heartbeat":
                await websocket.send_json({"event": "HEARTBEAT_ACK"})
    except WebSocketDisconnect:
        manager.disconnect_admin(websocket)
    except Exception as e:
        logger.error(f"[WS Admin] Unexpected error on socket: {e}")
        manager.disconnect_admin(websocket)


@router.websocket("/ws/customer")
async def websocket_customer_endpoint(
    websocket: WebSocket,
    token: str = Query(None)
):
    """
    Realtime WebSocket channel for Customer web/mobile application.
    Pushes order lifecycle progression, fulfillment status changes, and personalized notifications.
    """
    is_valid, payload = authenticate_ws_token(token)
    if not is_valid:
        logger.warning("[WS Customer] Connection rejected: Invalid or missing token")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = int(payload.get("sub", 0))
    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect_customer(user_id, websocket)

    try:
        await websocket.send_json({
            "event": "CONNECTED",
            "channel": "customer",
            "user_id": user_id,
            "message": "Connected to Yurae Realtime Patron Feed"
        })
    except Exception:
        pass

    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
            elif data == "heartbeat":
                await websocket.send_json({"event": "HEARTBEAT_ACK"})
    except WebSocketDisconnect:
        manager.disconnect_customer(user_id, websocket)
    except Exception as e:
        logger.error(f"[WS Customer] Unexpected error for user {user_id}: {e}")
        manager.disconnect_customer(user_id, websocket)
