# Performance note

During local verification, the Express server recorded 29.284 ms handling the initial request to `/`, and the automated test client recorded a 47 ms round-trip.

In a separate, later manual home-page reload with the cache disabled, I recorded DOMContentLoaded at 811 ms, Load at 1.52 seconds, and Finish at 2.20 seconds.

These measurements cover different activities across different runs. The 29.284 ms and 47 ms figures reflect HTTP socket handling on the loopback interface, while the later timings represent browser parsing and resource loading. They do not demonstrate an improvement from one number to another.

The browser numbers were user-reported rather than independently reproduced by an automated harness. A single local test does not establish typical performance or predict how the application will perform once deployed to real users.

No performance target was established specifically for the Task 2 home screen. Task 1 documents a target of three seconds for a useful authenticated account summary on a mid-range Android device under a mobile-network profile (`task-01-design-system/docs/business-decisions.md`, Section 7). Both the 1.52 s Load and 2.20 s Finish fall within that three-second figure, but they measure an unauthenticated home page on a local machine rather than the target mobile scenario.

