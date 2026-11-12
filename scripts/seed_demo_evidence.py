from db.session import get_db
from db.models import Investigation, EvidencePack, Dispute

def seed_evidence_pack():
    db = next(get_db())
    pack = db.query(EvidencePack).filter(EvidencePack.investigation_id == 'inv_shoppoint_001').first()
    if not pack:
        pack = EvidencePack(
            id='pack_shoppoint_001',
            merchant_id='merch_shoppoint',
            investigation_id='inv_shoppoint_001',
            version=1,
            pack_hash='e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            pack_json={
                'version': 1,
                'summary': 'Dispute evidence package for Chargeback PP-D-78192 (Item Not Received).',
                'attached_documents': [
                    {
                        'document_id': 'doc_carrier_proof_01',
                        'document_type': 'PROOF_OF_DELIVERY',
                        'filename': 'fedex_tracking_delivered.pdf',
                        'uploaded_at': '2026-11-09T20:40:09.320809',
                        'verification_status': 'VERIFIED'
                    },
                    {
                        'document_id': 'doc_signature_02',
                        'document_type': 'SIGNATURE_CONFIRMATION',
                        'filename': 'recipient_signature.png',
                        'uploaded_at': '2026-11-09T20:41:15.112000',
                        'verification_status': 'VERIFIED'
                    },
                    {
                        'document_id': 'doc_invoice_03',
                        'document_type': 'CUSTOMER_INVOICE',
                        'filename': 'invoice_ord_shoppoint.pdf',
                        'uploaded_at': '2026-11-09T20:42:00.000000',
                        'verification_status': 'VERIFIED'
                    }
                ],
                'deterministic_findings': [
                    {'rule': 'CARRIER_CONFIRMED_DELIVERED', 'status': 'PASS', 'description': 'FedEx tracking matches customer shipping address.'},
                    {'rule': 'SIGNATURE_MATCH', 'status': 'PASS', 'description': 'Direct signature on delivery acquired.'}
                ]
            },
            pack_md='# Evidence Package v1 - Dispute PP-D-78192\n\n## 1. Summary\nCarrier proof of delivery and direct signature confirmation attached to contest merchandise not received claim.\n\n## 2. Documents\n- Proof of Delivery: fedex_tracking_delivered.pdf\n- Signature Confirmation: recipient_signature.png\n- Order Invoice: invoice_ord_shoppoint.pdf'
        )
        db.add(pack)
        db.commit()
        print('EvidencePack created for inv_shoppoint_001 successfully!')
    else:
        print('EvidencePack already exists!')

if __name__ == '__main__':
    seed_evidence_pack()
