"""Dispute evidence pack builder.

TODO: Build dispute evidence packs mapped to PayPal evidence types:
- PROOF_OF_FULFILLMENT: delivery records, tracking, carrier, delivered date
- PROOF_OF_REFUND: refund ID, amount, date
- PROOF_OF_RETURN: return event record, received-at date
- OTHER: notes and context

Calculate checklist completeness % and heuristic win_likelihood.
"""
