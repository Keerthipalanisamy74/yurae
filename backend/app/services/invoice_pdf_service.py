import io
from typing import Any
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from app.core.config import settings

class InvoicePdfService:
    @staticmethod
    def generate_order_invoice_pdf(order: Any) -> bytes:
        """
        Generates a crisp, professional, luxury Tax Invoice PDF for an Order.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=20 * mm,
            rightMargin=20 * mm,
            topMargin=15 * mm,
            bottomMargin=15 * mm
        )

        styles = getSampleStyleSheet()
        
        # Custom Luxury Styles
        brand_title_style = ParagraphStyle(
            'BrandTitle',
            fontName='Helvetica-Bold',
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#111111'),
            spaceAfter=2
        )
        
        brand_subtitle_style = ParagraphStyle(
            'BrandSubtitle',
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#D84B7E'),
            textTransform='uppercase',
            spaceAfter=8
        )

        seller_details_style = ParagraphStyle(
            'SellerDetails',
            fontName='Helvetica',
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#444444')
        )

        invoice_badge_style = ParagraphStyle(
            'InvoiceBadge',
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            alignment=TA_RIGHT,
            textColor=colors.HexColor('#D84B7E')
        )

        invoice_meta_style = ParagraphStyle(
            'InvoiceMeta',
            fontName='Helvetica',
            fontSize=8,
            leading=12,
            alignment=TA_RIGHT,
            textColor=colors.HexColor('#333333')
        )

        box_heading_style = ParagraphStyle(
            'BoxHeading',
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#D84B7E'),
            spaceAfter=4
        )

        box_text_style = ParagraphStyle(
            'BoxText',
            fontName='Helvetica',
            fontSize=8.5,
            leading=11.5,
            textColor=colors.HexColor('#222222')
        )

        table_header_style = ParagraphStyle(
            'TableHeader',
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=10,
            textColor=colors.white,
            alignment=TA_CENTER
        )

        table_cell_style = ParagraphStyle(
            'TableCell',
            fontName='Helvetica',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#111111')
        )

        table_cell_bold = ParagraphStyle(
            'TableCellBold',
            fontName='Helvetica-Bold',
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor('#111111')
        )

        table_cell_right = ParagraphStyle(
            'TableCellRight',
            fontName='Helvetica',
            fontSize=8,
            leading=10,
            alignment=TA_RIGHT,
            textColor=colors.HexColor('#111111')
        )

        table_cell_right_bold = ParagraphStyle(
            'TableCellRightBold',
            fontName='Helvetica-Bold',
            fontSize=8.5,
            leading=11,
            alignment=TA_RIGHT,
            textColor=colors.HexColor('#111111')
        )

        terms_text_style = ParagraphStyle(
            'TermsText',
            fontName='Helvetica',
            fontSize=7.5,
            leading=10,
            textColor=colors.HexColor('#666666')
        )

        story = []

        # 1. Header Grid (Brand on Left, Invoice Meta on Right)
        # 1. Header Grid (Brand on Left, Invoice Meta on Right)
        seller_company = getattr(settings, 'SELLER_COMPANY_NAME', 'Yurae Beauty & Luxury Apparel Private Limited')
        seller_gstin = getattr(settings, 'SELLER_GSTIN', '33AAECY8721M1Z8')
        seller_pan = getattr(settings, 'SELLER_PAN', 'AAECY8721M')
        seller_state = getattr(settings, 'SELLER_STATE', 'Tamil Nadu')
        seller_state_code = getattr(settings, 'SELLER_STATE_CODE', '33')
        seller_address = getattr(settings, 'SELLER_ADDRESS', '74, Avenue Montaigne Botanical Complex, Anna Salai, Chennai, Tamil Nadu - 600002')
        seller_email = getattr(settings, 'SELLER_EMAIL', 'concierge@yuraebeauty.com')

        seller_info = f"""
        <b>{seller_company}</b><br/>
        {seller_address}<br/>
        <b>GSTIN:</b> {seller_gstin} • <b>PAN:</b> {seller_pan} • <b>State Code:</b> {seller_state_code}<br/>
        <b>Email:</b> {seller_email} • <b>Origin State:</b> {seller_state}
        """

        addr = getattr(order, 'address', None)
        buyer_user = getattr(order, 'user', None)
        buyer_name = (addr.name if addr else None) or (f"{buyer_user.first_name} {buyer_user.last_name}" if buyer_user else "Valued Patron")
        buyer_phone = addr.phone if addr else (buyer_user.phone if buyer_user and buyer_user.phone else "N/A")
        buyer_email = buyer_user.email if buyer_user else "customer@yuraebeauty.com"
        
        inv_date = order.created_at.strftime("%d %B %Y") if getattr(order, 'created_at', None) else "Today"
        pay_method = order.payments[0].payment_method if getattr(order, 'payments', None) and len(order.payments) > 0 else ("COD" if getattr(order, 'is_cod', False) else "Prepaid Online")

        invoice_meta = f"""
        <b>ORIGINAL TAX INVOICE</b><br/>
        <b>Invoice No:</b> INV-{order.order_number}<br/>
        <b>Invoice Date:</b> {inv_date}<br/>
        <b>Order Ref:</b> #{order.order_number}<br/>
        <b>Payment Mode:</b> {pay_method} ({order.payment_status})
        """

        header_data = [
            [
                [
                    Paragraph("Y U R A E", brand_title_style),
                    Paragraph("THE ORIGIN OF SKINCARE & LUXURY APPAREL", brand_subtitle_style),
                    Paragraph(seller_info, seller_details_style)
                ],
                [
                    Paragraph(invoice_meta, invoice_meta_style)
                ]
            ]
        ]

        header_table = Table(header_data, colWidths=[100 * mm, 70 * mm])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#111111'), spaceAfter=12))

        # 2. Billed To & Shipping Coordinates
        buyer_country = (addr.country if addr else "India").strip()
        buyer_state = (addr.state if addr else "Tamil Nadu").strip()
        is_export = buyer_country.lower() not in ("india", "in", "bharat")
        is_intra_state = not is_export and (buyer_state.lower() == seller_state.lower() or seller_state.lower() in buyer_state.lower())

        place_of_supply = "Export (Zero-Rated supply under LUT)" if is_export else f"{buyer_state}, India"

        buyer_address_html = f"""
        <b>{buyer_name}</b><br/>
        {addr.address_line1 if addr else 'Standard Delivery'}<br/>
        {f"{addr.address_line2}<br/>" if addr and addr.address_line2 else ""}
        {f"{addr.city}, {addr.state} - {addr.postal_code}" if addr else "Chennai, Tamil Nadu"}<br/>
        {buyer_country}<br/>
        Phone: {buyer_phone} • Email: {buyer_email}
        """

        logistics_info_html = f"""
        <b>Place of Supply:</b> {place_of_supply}<br/>
        <b>GST Category:</b> {"Zero-Rated Export" if is_export else ("Intra-State (CGST + SGST)" if is_intra_state else "Inter-State (IGST)")}<br/>
        <b>Fulfillment Mode:</b> Express Luxury Logistics (Shiprocket)<br/>
        <b>AWB Tracking:</b> {order.awb_code if getattr(order, 'awb_code', None) else 'Assigned on Dispatch'}<br/>
        <b>Courier Partner:</b> {order.courier_name if getattr(order, 'courier_name', None) else 'Blue Dart Express'}
        """

        address_data = [
            [
                [
                    Paragraph("BILLED & SHIPPED TO:", box_heading_style),
                    Paragraph(buyer_address_html, box_text_style)
                ],
                [
                    Paragraph("DISPATCH & GST LOGISTICS:", box_heading_style),
                    Paragraph(logistics_info_html, box_text_style)
                ]
            ]
        ]

        address_table = Table(address_data, colWidths=[85 * mm, 85 * mm])
        address_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FFF8FA')),
            ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#F1BCCE')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ]))
        story.append(address_table)
        story.append(Spacer(1, 14))

        # 3. Itemized Products Table
        items_table_data = [
            [
                Paragraph("#", table_header_style),
                Paragraph("PRODUCT DESCRIPTION", table_header_style),
                Paragraph("HSN/SAC", table_header_style),
                Paragraph("QTY", table_header_style),
                Paragraph("UNIT PRICE", table_header_style),
                Paragraph("TOTAL", table_header_style),
            ]
        ]

        curr = order.currency or "INR"

        for idx, it in enumerate(order.items):
            pname = it.product_name.lower()
            if any(w in pname for w in ["wash", "serum", "balm", "cream", "lotion", "toner", "cleanser", "mist", "oil"]):
                hsn = "33049900"
            elif any(w in pname for w in ["ring", "necklace", "pendant", "bracelet", "earring", "jewelry", "jewellery", "pearl"]):
                hsn = "71131120"
            else:
                hsn = "62044390"

            variant_desc = f"<br/><font color='#D84B7E' size='7'><b>{it.variant_info}</b></font>" if getattr(it, 'variant_info', None) else ""
            desc_html = f"<b>{it.product_name}</b>{variant_desc}"

            items_table_data.append([
                Paragraph(str(idx + 1), table_cell_style),
                Paragraph(desc_html, table_cell_style),
                Paragraph(hsn, table_cell_style),
                Paragraph(str(it.quantity), ParagraphStyle('CenterCell', parent=table_cell_style, alignment=TA_CENTER)),
                Paragraph(f"{curr} {it.price:,.2f}", table_cell_right),
                Paragraph(f"{curr} {it.price * it.quantity:,.2f}", table_cell_right_bold),
            ])

        items_table = Table(items_table_data, colWidths=[10 * mm, 72 * mm, 20 * mm, 14 * mm, 26 * mm, 28 * mm])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#111111')),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('LINEBELOW', (0, 1), (-1, -1), 0.5, colors.HexColor('#F1BCCE')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#111111')),
        ]))
        story.append(items_table)
        story.append(Spacer(1, 12))

        # 4. Totals & Dynamic Tax Split Breakdown
        subtotal_val = getattr(order, 'subtotal', getattr(order, 'subtotal_amount', 0.0))
        discount_val = getattr(order, 'discount', getattr(order, 'discount_amount', 0.0)) or 0.0
        shipping_val = getattr(order, 'shipping_fee', getattr(order, 'shipping_amount', 0.0)) or 0.0
        tax_val = getattr(order, 'tax', 0.0) or 0.0
        total_val = getattr(order, 'total_amount', 0.0)

        tax_rows = []
        if is_export:
            tax_rows = [
                [
                    "",
                    Paragraph("<b>IGST (Zero-Rated Export):</b>", terms_text_style),
                    Paragraph(f"{curr} 0.00", ParagraphStyle('TaxR', parent=table_cell_right, fontSize=7.5))
                ]
            ]
        elif is_intra_state:
            half_tax = tax_val / 2 if tax_val > 0 else (subtotal_val * 0.09)
            tax_rows = [
                [
                    "",
                    Paragraph("<b>CGST (9% Included):</b>", terms_text_style),
                    Paragraph(f"{curr} {half_tax:,.2f}", ParagraphStyle('TaxR', parent=table_cell_right, fontSize=7.5))
                ],
                [
                    "",
                    Paragraph("<b>SGST (9% Included):</b>", terms_text_style),
                    Paragraph(f"{curr} {half_tax:,.2f}", ParagraphStyle('TaxR2', parent=table_cell_right, fontSize=7.5))
                ]
            ]
        else:
            tax_rows = [
                [
                    "",
                    Paragraph("<b>IGST (18% Included):</b>", terms_text_style),
                    Paragraph(f"{curr} {tax_val:,.2f}", ParagraphStyle('TaxR', parent=table_cell_right, fontSize=7.5))
                ]
            ]

        totals_data = [
            [
                Paragraph("<b>Terms & Conditions:</b><br/>1. Goods are eligible for exchange/return within 7 days under luxury return policy.<br/>2. Computer generated tax invoice; no physical signature required.<br/>3. All disputes subject to Chennai, Tamil Nadu jurisdiction.", terms_text_style),
                Paragraph("<b>Subtotal:</b>", table_cell_style),
                Paragraph(f"{curr} {subtotal_val:,.2f}", table_cell_right)
            ],
            [
                "",
                Paragraph("<b>Coupon Savings:</b>", ParagraphStyle('Dis', parent=table_cell_style, textColor=colors.HexColor('#D84B7E'))),
                Paragraph(f"-{curr} {discount_val:,.2f}" if discount_val > 0 else f"{curr} 0.00", ParagraphStyle('DisR', parent=table_cell_right, textColor=colors.HexColor('#D84B7E')))
            ],
            [
                "",
                Paragraph("<b>Shipping & Handling:</b>", table_cell_style),
                Paragraph(f"{curr} {shipping_val:,.2f}" if shipping_val > 0 else "FREE", table_cell_right)
            ],
            *tax_rows,
            [
                "",
                Paragraph("<b>GRAND TOTAL:</b>", ParagraphStyle('GT', fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor('#111111'))),
                Paragraph(f"<b>{curr} {total_val:,.2f}</b>", ParagraphStyle('GTR', fontName='Helvetica-Bold', fontSize=11, textColor=colors.HexColor('#D84B7E'), alignment=TA_RIGHT))
            ]
        ]

        total_rows_count = len(totals_data)
        totals_table = Table(totals_data, colWidths=[90 * mm, 45 * mm, 35 * mm])
        totals_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('SPAN', (0, 0), (0, total_rows_count - 1)),  # Span terms across left column
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('LINEABOVE', (1, total_rows_count - 1), (2, total_rows_count - 1), 1.5, colors.HexColor('#111111')),
        ]))
        story.append(totals_table)
        story.append(Spacer(1, 14))

        # 5. Authentic Seal & Footer
        footer_text = """
        <font size="7" color="#777777">
        Thank you for choosing Yurae. May your skincare ritual and luxury wardrobe bring you timeless grace.<br/>
        <b>Authorized Signatory:</b> Yurae Beauty & Luxury Apparel Private Limited • Registered in India
        </font>
        """
        story.append(HRFlowable(width="100%", thickness=0.75, color=colors.HexColor('#F1BCCE'), spaceAfter=8))
        story.append(Paragraph(footer_text, ParagraphStyle('Footer', alignment=TA_CENTER)))

        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
