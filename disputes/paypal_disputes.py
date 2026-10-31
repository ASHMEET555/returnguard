"""PayPal Disputes API client (sandbox-gated).

TODO: Retrieve dispute listings and details from PayPal Customer Disputes API.
Implement provide-evidence submission endpoint gated strictly behind:
- PAYPAL_SUBMIT_ENABLED=true
- Sandbox environment
- Dispute status WAITING_FOR_SELLER_RESPONSE
- Verified human approval record
"""
