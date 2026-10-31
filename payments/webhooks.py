"""PayPal webhook signature verification and idempotent processing.

TODO: Verify PayPal webhook signatures using certs / webhook ID.
Record incoming events in payment_event by event_id, ensuring duplicate events
are treated as idempotent no-ops.
"""
