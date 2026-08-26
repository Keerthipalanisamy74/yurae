import io
import logging
from typing import Dict, Any, List
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from app.core.config import settings

logger = logging.getLogger("yurae.packingslip")

class PackingSlipService:
    """
    Generates luxury packing slips and warehouse dispatch manifests
    with itemized barcodes and quality assurance checklists.
    """

    @classmethod
    def get_packing_slip_data(cls, order: Any) -> Dict[str, Any]:
        addr = getattr(order, 'address', None)
        buyer_user = getattr(order, 'user', None)
        buyer_name = (addr.name if addr else None) or (f"{buyer_user.first_name} {buyer_user.last_name}" if buyer_user else "Valued Patron")
        buyer_phone = addr.phone if addr else (buyer_user.phone if buyer_user and buyer_user.phone else "N/A")
        buyer_email = buyer_user.email if buyer_user else "customer@yuraebeauty.com"

        items_list = []
        total_qty = 0
        for it in order.items:
            pname = it.product_name.lower()
            if any(w in pname for w in ["wash", "serum", "balm", "cream", "lotion", "toner", "cleanser", "mist", "oil"]):
                hsn = "33049900"
            elif any(w in pname for w in ["ring", "necklace", "pendant", "bracelet", "earring", "jewelry", "jewellery", "pearl"]):
                hsn = "71131120"
            else:
                hsn = "62044390"

            items_list.append({
                "product_name": it.product_name,
                "variant_info": it.variant_info,
                "sku": f"YUR-{it.product_id:04d}",
                "hsn_code": hsn,
                "quantity": it.quantity,
                "unit_price": it.price,
                "total_price": it.price * it.quantity
            })
            total_qty += it.quantity

        is_cod = bool(getattr(order, 'is_cod', False))
        pay_method = order.payments[0].payment_method if getattr(order, 'payments', None) and len(order.payments) > 0 else ("COD" if is_cod else "Prepaid Online")

        routing_code = f"BLR-{getattr(order, 'courier_id', 'EXP')}-{addr.postal_code[:3] if addr and addr.postal_code else '560'}"

        return {
            "order_number": order.order_number,
            "awb_code": getattr(order, 'awb_code', None) or f"AWB-{order.order_number[-8:]}",
            "courier_name": getattr(order, 'courier_name', None) or "Blue Dart Express Air",
            "routing_code": routing_code,
            "barcode_text": f"*{order.order_number}*",
            "order_date": order.created_at.strftime("%d %B %Y, %I:%M %p") if getattr(order, 'created_at', None) else "Today",
            "payment_method": pay_method,
            "payment_status": order.payment_status,
            "is_cod": is_cod,
            "cod_amount": getattr(order, 'cod_amount', 0.0) if is_cod else 0.0,
            "total_quantity": total_qty,
            "subtotal": getattr(order, 'subtotal', 0.0),
            "shipping_fee": getattr(order, 'shipping_fee', 0.0),
            "discount": getattr(order, 'discount', 0.0),
            "total_amount": order.total_amount,
            "currency": order.currency or "INR",
            "recipient": {
                "name": buyer_name,
                "phone": buyer_phone,
                "email": buyer_email,
                "address_line1": addr.address_line1 if addr else "Standard Delivery Address",
                "address_line2": addr.address_line2 if addr else "",
                "building_or_flat": getattr(addr, 'building_or_flat', '') if addr else "",
                "landmark": getattr(addr, 'landmark', '') if addr else "",
                "city": addr.city if addr else "Bengaluru",
                "state": addr.state if addr else "Karnataka",
                "postal_code": addr.postal_code if addr else "560001",
                "country": addr.country if addr else "India"
            },
            "sender": {
                "company_name": getattr(settings, 'SELLER_COMPANY_NAME', 'Yurae Beauty & Luxury Apparel Private Limited'),
                "warehouse": "Yurae Central Botanical Atelier & Fulfillment Hub",
                "address": getattr(settings, 'SELLER_ADDRESS', '74, Avenue Montaigne Botanical Complex, Anna Salai, Chennai, Tamil Nadu - 600002'),
                "pincode": getattr(settings, 'WAREHOUSE_PINCODE', '600002'),
                "contact": getattr(settings, 'SELLER_PHONE', '+91 98765 43210')
            },
            "items": items_list,
            "luxury_packaging_checklist": [
                "1. Botanical Formula Sealed in UV Glass / Fabric Pressed",
                "2. Luxury Velvet Dust Bag / Silk Protective Wrap Included",
                "3. Embossed Yurae Authenticity & Botanical Care Guide Enclosed",
                "4. Tax Invoice & 7-Day Exchange Slip Inserted in Dispatch Pouch",
                "5. Eco-Friendly Tamper-Evident Security Seal Applied"
            ]
        }

    @classmethod
    def generate_packing_slip_pdf(cls, order: Any) -> bytes:
        data = cls.get_packing_slip_data(order)
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=15 * mm,
            rightMargin=15 * mm,
            topMargin=12 * mm,
            bottomMargin=12 * mm
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle('PS_Title', fontName='Helvetica-Bold', fontSize=18, leading=22, textColor=colors.HexColor('#111111'))
        subtitle_style = ParagraphStyle('PS_Sub', fontName='Helvetica', fontSize=8, leading=11, textColor=colors.HexColor('#D84B7E'))
        barcode_style = ParagraphStyle('PS_Barcode', fontName='Courier-Bold', fontSize=14, leading=16, alignment=TA_CENTER, textColor=colors.HexColor('#111111'))
        meta_style = ParagraphStyle('PS_Meta', fontName='Helvetica', fontSize=8, leading=11, textColor=colors.HexColor('#333333'))
        box_head_style = ParagraphStyle('PS_BoxHead', fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=colors.HexColor('#111111'))
        box_text_style = ParagraphStyle('PS_BoxText', fontName='Helvetica', fontSize=7.5, leading=10, textColor=colors.HexColor('#444444'))
        table_hdr = ParagraphStyle('PS_TableHdr', fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=colors.white, alignment=TA_CENTER)
        table_cell = ParagraphStyle('PS_TableCell', fontName='Helvetica', fontSize=8, leading=10, textColor=colors.HexColor('#111111'))
        table_cell_center = ParagraphStyle('PS_TableCellC', fontName='Helvetica', fontSize=8, leading=10, alignment=TA_CENTER)
        check_item_style = ParagraphStyle('PS_Check', fontName='Helvetica', fontSize=7.5, leading=10, textColor=colors.HexColor('#2E7D32'))

        story = []

        # Top Barcode & Brand
        header_table_data = [
            [
                [
                    Paragraph("Y U R A E", title_style),
                    Paragraph("WAREHOUSE DISPATCH PACKING SLIP & ROUTING MANIFEST", subtitle_style),
                    Paragraph(f"<b>Order No:</b> {data['order_number']}<br/><b>Order Date:</b> {data['order_date']}<br/><b>Routing Hub:</b> {data['routing_code']}", meta_style)
                ],
                [
                    Paragraph(f"||| | |||| ||| ||||| |||| || ||||||<br/><b>{data['order_number']}</b>", barcode_style),
                    Spacer(1, 4),
                    Paragraph(f"<b>Carrier:</b> {data['courier_name']}<br/><b>AWB Tracking:</b> {data['awb_code']}<br/><b>Payment:</b> {data['payment_method']} ({'COLLECT ' + data['currency'] + ' ' + str(data['cod_amount']) if data['is_cod'] else 'PREPAID - DO NOT COLLECT'})", ParagraphStyle('CarrierMeta', parent=meta_style, alignment=TA_CENTER))
                ]
            ]
        ]
        header_table = Table(header_table_data, colWidths=[100 * mm, 80 * mm])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 8))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#111111'), spaceAfter=10))

        # Recipient vs Warehouse origin
        rec = data['recipient']
        snd = data['sender']
        rec_html = f"<b>{rec['name']}</b><br/>{rec['address_line1']}<br/>{rec['city']}, {rec['state']} - {rec['postal_code']}<br/>{rec['country']}<br/>Phone: {rec['phone']}"
        snd_html = f"<b>{snd['company_name']}</b><br/>{snd['warehouse']}<br/>{snd['address']}<br/>Origin PIN: {snd['pincode']} • Helpline: {snd['contact']}"

        address_table_data = [
            [
                [Paragraph("SHIP TO (PATRON):", box_head_style), Paragraph(rec_html, box_text_style)],
                [Paragraph("DISPATCH FROM (ORIGIN ATELIER):", box_head_style), Paragraph(snd_html, box_text_style)]
            ]
        ]
        address_table = Table(address_table_data, colWidths=[90 * mm, 90 * mm])
        address_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FFF8FA')),
            ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#F1BCCE')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(address_table)
        story.append(Spacer(1, 10))

        # Itemized Checklist
        items_table_data = [
            [
                Paragraph("#", table_hdr),
                Paragraph("SKU", table_hdr),
                Paragraph("PRODUCT / RITUAL DESCRIPTION", table_hdr),
                Paragraph("VARIANT", table_hdr),
                Paragraph("HSN", table_hdr),
                Paragraph("QTY", table_hdr),
                Paragraph("CHECK", table_hdr)
            ]
        ]

        for idx, item in enumerate(data['items']):
            items_table_data.append([
                Paragraph(str(idx + 1), table_cell_center),
                Paragraph(item['sku'], table_cell),
                Paragraph(f"<b>{item['product_name']}</b>", table_cell),
                Paragraph(item['variant_info'] or "Standard", table_cell),
                Paragraph(item['hsn_code'], table_cell_center),
                Paragraph(f"<b>{item['quantity']}</b>", table_cell_center),
                Paragraph("[  ]", ParagraphStyle('BoxC', parent=table_cell_center, fontName='Helvetica-Bold'))
            ])

        items_table = Table(items_table_data, colWidths=[8 * mm, 24 * mm, 70 * mm, 30 * mm, 20 * mm, 14 * mm, 14 * mm])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#111111')),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('LINEBELOW', (0, 1), (-1, -1), 0.5, colors.HexColor('#F1BCCE')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#111111')),
        ]))
        story.append(items_table)
        story.append(Spacer(1, 10))

        # Packaging QA Checklist
        qa_rows = [[Paragraph("<b>LUXURY QUALITY ASSURANCE & PACKAGING PROTOCOL:</b>", box_head_style)]]
        for chk in data['luxury_packaging_checklist']:
            qa_rows.append([Paragraph(f"[✓] {chk}", check_item_style)])

        qa_table = Table(qa_rows, colWidths=[180 * mm])
        qa_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F9FDF9')),
            ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#A5D6A7')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(qa_table)
        story.append(Spacer(1, 8))

        # Footer Signature Box
        footer_data = [
            [
                Paragraph("<b>Packed By:</b> ____________________", meta_style),
                Paragraph("<b>Verified By QC:</b> ____________________", meta_style),
                Paragraph(f"<b>Total Units:</b> {data['total_quantity']}", ParagraphStyle('TotalU', parent=meta_style, fontName='Helvetica-Bold', alignment=TA_RIGHT))
            ]
        ]
        footer_table = Table(footer_data, colWidths=[60 * mm, 60 * mm, 60 * mm])
        story.append(footer_table)

        doc.build(story)
        return buffer.getvalue()
