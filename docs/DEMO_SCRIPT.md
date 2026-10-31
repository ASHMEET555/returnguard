# ReturnGuard Demo Script (Video <= 3 min / Live <= 5 min)

TODO: Rehearse and execute the demo beats defined in 03-phases.md:

1. **Clean prepaid loyal order (PayPal sandbox)**:
   - Normal customer checkout via PayPal sandbox button.
   - Low risk score (< 0.30, `none`), captured automatically without friction.

2. **COD first order, high-risk pincode**:
   - High risk score (0.50–0.67, `warning`), soft action triggered (`step_up_verify` / `prefer_prepaid`).

3. **Velocity spike**:
   - Burst orders triggered within 24h window.
   - Spike detector flags `spike_velocity` rule hit badge.

4. **Address abuse ring**:
   - Multiple customer accounts tied to same physical address and device.
   - Flagged with `ring_id` badge; open AG Grid ring drawer showing graph edges.

5. **Model performance & Net ₹**:
   - Show precision, recall, F1, and Net INR economics table per channel (`cod` and `paypal`).

6. **PayPal dispute & Evidence verifier**:
   - View dispute imported from PayPal sandbox.
   - Generate evidence pack mapped to PayPal evidence types (`PROOF_OF_FULFILLMENT`, etc.).
   - LLM assistant provides plain-language explanation citing verified record IDs only.
   - Human merchant reviews and clicks approve.
   - Sandbox submit executed with audit logging.

7. **Audit & PayPal sandbox verification**:
   - Inspect PayPal sandbox transaction ID and `audit_score_event` / `merchant_audit` rows.
