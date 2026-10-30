# Kobo Watt: Business Brief

## The business
I am designing Kobo Watt, a fictional rent-to-own solar/inverter service in Ikeja, Lagos. My prototype uses test payments and simulated account access; it does not control hardware or prove that electricity is flowing.

My demonstration price is ₦3,641,200. An exact ₦1,092,400 deposit reduces the balance but buys no access time. The remaining ₦2,548,800 buys 720 paid days at ₦3,540 per day, not a guaranteed 24-calendar-month completion. Full payment removes nonpayment expiry, not hardware faults.

## The person who uses it
I use Adaobi, 38, a salon owner, as a provisional persona, not an interviewed customer. I assume users aged 25–55 with mid-range Android phones, outdoor use and intermittent mobile data, who understand WhatsApp and transfers better than technical settings.

Her worst moment in my scenario is losing power while serving a customer, after trying to pay, without knowing whether the payment counted. This is a design scenario, not a research finding.

## The one thing that must work
Adaobi must understand her recorded access and whether her payment credited her account.

After the confirmed deposit, a separate access payment starts paid time. The minimum is ₦3,540, except a smaller final balance paid exactly; larger payments may buy fractional days. Overpayment is prevented. One fixed 48-hour grace window starts at the first paid-access expiry; payments never restart it.

Payments need signal. Delayed confirmation stays pending; reopening checks the existing attempt instead of charging again. Offline, an already-open screen shows a minimal, time-stamped “last known—not current” snapshot for at most five minutes after refresh, hides in the background and clears on expiry, reload, logout or account change.

For active access with no power, I provide “Get help” → “Access active, but no power”: a labelled demonstration help page, not another payment demand or a claim that support was contacted.

## Three customer questions
1. “How much paid time do I have left?”
2. “How much must I pay to stay active until Friday evening?”
3. “Did my payment count, and how much do I still owe?”

## Why the interface must feel this way
I want a steady, plain, receipt-like interface because uncertainty during a salon interruption can lead to repeated payments. I use Source Sans Pro SemiBold (600), clear size differences and 1.5 line spacing to organise amounts, status and instructions. Readability remains untested.

Detailed rules: [business-decisions.md](business-decisions.md). Pricing assumptions: [pricing-model.md](pricing-model.md).
