import json
import asyncio
import logging
from typing import Dict, Set, Any, Optional
from datetime import datetime
from fastapi import WebSocket

logger = logging.getLogger("yurae.events")

class ConnectionManager:
    def __init__(self):
        # Set of active WebSocket connections for admin staff
        self.admin_connections: Set[WebSocket] = set()
        # Map of user_id -> Set of active WebSocket connections for customer sessions
        self.customer_connections: Dict[int, Set[WebSocket]] = {}

    async def connect_admin(self, websocket: WebSocket):
        await websocket.accept()
        self.admin_connections.add(websocket)
        logger.info(f"[WS] Admin connected. Total active admins: {len(self.admin_connections)}")

    def disconnect_admin(self, websocket: WebSocket):
        self.admin_connections.discard(websocket)
        logger.info(f"[WS] Admin disconnected. Total active admins: {len(self.admin_connections)}")

    async def connect_customer(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.customer_connections:
            self.customer_connections[user_id] = set()
        self.customer_connections[user_id].add(websocket)
        logger.info(f"[WS] Customer {user_id} connected. Active sockets for user: {len(self.customer_connections[user_id])}")

    def disconnect_customer(self, user_id: int, websocket: WebSocket):
        if user_id in self.customer_connections:
            self.customer_connections[user_id].discard(websocket)
            if not self.customer_connections[user_id]:
                del self.customer_connections[user_id]
        logger.info(f"[WS] Customer {user_id} disconnected.")

    async def broadcast_to_admins(self, event_type: str, data: Dict[str, Any]):
        message = {
            "event": event_type,
            "data": data,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        dead_connections = set()
        for connection in list(self.admin_connections):
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"[WS] Failed to send message to admin socket: {e}")
                dead_connections.add(connection)
        
        for dead in dead_connections:
            self.admin_connections.discard(dead)

    async def send_to_customer(self, user_id: int, event_type: str, data: Dict[str, Any]):
        message = {
            "event": event_type,
            "data": data,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        if user_id in self.customer_connections:
            dead_connections = set()
            for connection in list(self.customer_connections[user_id]):
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.warning(f"[WS] Failed to send message to customer {user_id} socket: {e}")
                    dead_connections.add(connection)
            
            for dead in dead_connections:
                self.customer_connections[user_id].discard(dead)
            if not self.customer_connections[user_id]:
                del self.customer_connections[user_id]

    async def broadcast_all(self, event_type: str, data: Dict[str, Any]):
        await self.broadcast_to_admins(event_type, data)
        message = {
            "event": event_type,
            "data": data,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        for user_id, connections in list(self.customer_connections.items()):
            dead_connections = set()
            for connection in list(connections):
                try:
                    await connection.send_json(message)
                except Exception as e:
                    dead_connections.add(connection)
            for dead in dead_connections:
                connections.discard(dead)


# Global connection manager instance
manager = ConnectionManager()


class YuraeEventBus:
    """
    Centralized Realtime Event Bus for Yurae Platform.
    Allows services and endpoints to broadcast events to admin and customer WebSocket channels.
    """
    @staticmethod
    async def publish_async(event_type: str, data: Dict[str, Any], target_user_id: Optional[int] = None, to_admins: bool = True):
        try:
            if to_admins:
                await manager.broadcast_to_admins(event_type, data)
            if target_user_id is not None:
                await manager.send_to_customer(target_user_id, event_type, data)
        except Exception as e:
            logger.error(f"[EventBus] Error publishing async event '{event_type}': {e}")

    @staticmethod
    def publish(event_type: str, data: Dict[str, Any], target_user_id: Optional[int] = None, to_admins: bool = True):
        """
        Synchronous wrapper that safely schedules event emission onto the running asyncio event loop.
        Can be called from synchronous FastAPI route handlers or background services.
        """
        try:
            loop = None
            try:
                loop = asyncio.get_running_loop()
            except RuntimeError:
                loop = None

            if loop and loop.is_running():
                asyncio.run_coroutine_threadsafe(
                    YuraeEventBus.publish_async(event_type, data, target_user_id=target_user_id, to_admins=to_admins),
                    loop
                )
            else:
                # If no running event loop in current thread, create a quick task
                asyncio.run(YuraeEventBus.publish_async(event_type, data, target_user_id=target_user_id, to_admins=to_admins))
        except Exception as e:
            logger.error(f"[EventBus] Error in publish wrapper for '{event_type}': {e}")
