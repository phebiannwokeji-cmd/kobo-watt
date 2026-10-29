# Task 1 — Interview Answers

## 1. How would you structure design tokens?

I would organise my design tokens in three layers: palette values, colour roles, and component uses.

Palette values store the actual colours, such as Primary40. Colour roles describe their purpose, such as Primary for a main action or On-Primary for the text placed on it. Components, such as my payment button, use those roles instead of choosing colours directly.

For light and dark designs, the same purpose can point to different palette values. I also keep named typography styles and shadow settings so I can reuse them consistently.

In Kobo Watt, I converted the exported Figma values into CSS using a script. My deliberate regression showed why the connections matter:
when I replaced a role’s palette reference with a fixed HEX value, that role stopped following changes to the palette.



## 2. When is a token change breaking?

A token change is breaking when something that uses it can no longer work or look as intended. Examples include deleting a token, renaming it without updating its references, or changing its value into a different kind of value.

Keeping the same name does not guarantee a safe change. A new colour could make text difficult to read against its background, while a larger text size could cause a payment amount to overflow its card.

In Kobo Watt, removing the Primary role would affect the payment button that uses it. Changing Primary also means checking On-Primary, because the button background and its text must remain readable together.

Before accepting a change, I would find where the token is used, check that its references still resolve, and test the affected screens in light and dark themes. If I needed to rename a widely used token, I would temporarily keep the old name pointing to the new one while updating its users.



## 3. How would you support multiple brands and themes?

I would keep the names of colour roles consistent while changing
the values they point to for each brand and theme. A payment button
would still use Primary for its background and On-Primary for its
text, whichever brand or theme is selected.

Each brand would have its own palette. Light and dark themes would
map the shared roles to suitable colours from that palette. Brand
differences could also include font families and corner shapes.

Kobo Watt currently supports one brand with light and dark colour
roles. Its CSS defines light values in :root and dark values under
[data-theme="dark"]. Supporting another brand would require additional
brand-specific definitions; that has not been implemented yet.

I would check every supported brand-and-theme combination for missing
references, readable colour pairs, and layout problems. Reusing the
same role names makes switching easier, but it does not guarantee
that every combination is accessible or visually suitable.


## 4. Can tokens guarantee accessible contrast?

No. Tokens help me reuse checked colour combinations, but they
cannot guarantee that every screen uses those combinations correctly.

For example, my payment button uses Primary for its background
and On-Primary for its text. Even if that pair passes a contrast check, placing On-Primary text on a different background could fail.
Transparency, background images, and changes between light and
dark themes can also affect the result.

I would measure the actual text and background colours together.
For ordinary text, WCAG Level AA generally requires a contrast
ratio of at least 4.5:1; qualifying large text requires at least 3:1.
A contrast ratio measures the difference in brightness between
the two colours.

I would check the combinations used in each theme and relevant
interaction state, including error messages and hover states.
If a pair fails, I would change the role mapping or restrict where that pair can be used.

Tokens make consistency easier. Testing the finished interface
is still necessary.


## 5. How do you ensure that colour contrast guidelines are met within a website or application's design?

I start by listing the colour pairs used on the screen, such as
On-Primary text on a Primary button. I record their actual colour
values, measured contrast ratios, and whether they pass the
requirement for their use.

For WCAG Level AA, ordinary text generally needs at least 4.5:1
contrast. Qualifying large text needs at least 3:1. I check text
size and weight before applying the lower threshold.

I then test the implemented screen, because the browser may show
different results from the design file. Transparency, images,
overrides, and interaction states can change the colours that
actually appear together.

I check both light and dark themes, including links, buttons,
help text, and error messages. I also assess essential control
boundaries and focus indicators against their applicable requirements.

When a pair fails, I adjust its role mapping or background and
test again. I record the fix or explain why the pair is restricted
to a use where that text requirement does not apply.

I repeat these checks after relevant token or component changes.


## 6. Can you discuss the differences between WCAG levels A, AA and AAA?

WCAG stands for Web Content Accessibility Guidelines. It defines testable requirements that help make websites usable by people with disabilities.

Level A is the minimum level. It addresses fundamental barriers, such as being unable to operate a website using a keyboard.

Level AA includes every Level A requirement and additional
requirements, including minimum text contrast. Meeting a few
AA requirements does not mean the whole website meets Level AA.

Level AAA includes all A and AA requirements plus further,
stricter requirements. W3C does not recommend requiring AAA
across every entire website because some content cannot satisfy
all its requirements.

For Kobo Watt, I would target WCAG 2.2 Level AA and adopt useful AAA improvements where practical. That is a target, not a claim that the project already meets every requirement.

I would assess complete pages and complete processes, such as
making a payment. Passing colour contrast checks alone cannot
prove accessibility: keyboard use, labels, errors, and other
applicable requirements also need checking.


## 7. Discuss the importance of semantic HTML in the context of accessibility.

Semantic HTML means using elements that match the purpose of the
content. I use headings for section titles, buttons for actions,
links for navigation, and labels connected to form fields.

This helps screen readers—software that presents screen content
through speech or braille—identify the page’s structure and controls.
Real headings also let screen-reader users jump between sections.

In Kobo Watt, the payment action uses a button, the help route uses
a link, and the amount field has a connected label. A native button
already supports keyboard interaction. A plain box styled to look
like a button would need extra work to provide equivalent behaviour.

I keep meaning separate from appearance. For example, a heading’s
level should describe its place in the page, while a typography
style controls how large it looks.

Semantic HTML provides a strong foundation, but it does not guarantee
accessibility. I still need to check keyboard navigation, visible
focus, error announcements, and colour contrast in the working page.


## 8. How do you handle design handoff to developers using Figma?

I provide the Figma design together with its colour roles, typography styles, shadows, and written decisions. I explain how components should behave, including error states, small-screen layouts, and light and dark appearances. I identify anything that remains undecided.

For Kobo Watt, I exported colours, typography, and effects as JSON, including the Figma variables. I kept the incomplete export as evidence of the missing colour variables, then supplied the corrected export for conversion into CSS.

I instructed the coding agent to use colour roles on the interface instead of raw colours or direct palette references. I also supplied the business brief and supporting documents so implementation choices had context.

I check the result against the design rather than assuming the
handoff worked. My evidence includes before-and-after screenshots, a raw-colour search, and the agent’s explanation of the typography used for the remaining balance.

When something differs, I record whether it is a mistake to fix or an intentional change with a reason. I keep the design, documentation, and implementation aligned.


## 9. Why do AI-generated interfaces tend to look generic, and what specifically do you hand an agent to stop it?

My explanation is that broad instructions leave many design
decisions open. An agent may fill those gaps with familiar layouts, fonts, colours, and components that could belong to almost any product.

To reduce this, I give the agent a specific customer, a clear task, and concrete design rules. For Kobo Watt, the context is Adaobi checking payments and recorded account access, including the stressful moment when she is unsure whether a payment counted.

I provide the business brief, Figma examples, exported tokens,
colour-role mappings, typography values, shadow settings, and
documented reasons for my choices. I explicitly require the interface to use the supplied roles and styles.

I also identify what matters most on the screen: payment amounts, account information, and clear instructions. This gives the design a purpose beyond decoration.

Finally, I check the result through screenshots, code searches, and questions about the styles actually used. Supplying a design system gives direction, but it does not guarantee that the agent will follow it or produce a distinctive, usable interface.


## 10. Why did you choose that Display Large line height rather than one step either side?

My Display Large font size is 64px, and I chose a line height
of 96px. This is a multiplier of 1.5. My intention is to leave
space between lines while keeping a heading visually connected.

At 1.4, the line height would be 89.6px. This would make a
multiline heading more compact, but it would leave less space
between its lines.

At 1.6, the line height would be 102.4px. This would provide more space, but a wrapped heading would become taller and could push important account information further down the screen.

I chose 1.5 as a middle position between those trade-offs.
However, my current Display Large example is a single line,
so it does not prove that 96px is the best choice for wrapped
headings. I would compare all three settings using realistic
multiline headings on small screens before treating this choice
as fully validated.

The 1.5 multiplier is my design decision, not proof that the
interface meets accessibility requirements.


## 11. What would you change in your token structure, and what would it cost?

I would reconsider how I organised light and dark colour roles
in Figma. My current structure has separate Light and Dark groups, with 50 roles in each.

If I started again, I would investigate using one shared set of
50 roles with Light and Dark variable modes. A component could
reference Primary once, while the selected mode would determine
its value. My generated CSS already follows a similar idea:
the same role names receive different values for each theme.

This could reduce duplicated role definitions and the need to
connect components separately to light and dark variables.

The cost would be migrating existing references, checking that
my Figma plan and export plugin support the approach, and updating the converter if the export structure changed. I would also need to repeat reference and contrast checks and update the evidence.

My current approach works, so I would not rebuild it just for
tidiness. I would make the change when maintaining more themes
or components made the benefit worth the migration effort.


## 12. What is missing from the claim that exporting HEX values into one CSS file creates a single source of truth?

The useful part is centralising colour values. What is missing
is a maintained connection between those values, their intended
roles, and the components that use them.

I would store palette values, map roles such as Primary and
On-Primary to that palette, and make components reference the
roles. I would also define the authoritative source and how its
changes reach the generated CSS. Exporting once does not establish that ongoing process.

By month four, a brand update could expose copied HEX values or
manual edits that have drifted from the source. Connected components would update, while disconnected ones could keep the old colours.
Even connected colour pairs would need fresh contrast checks.

My deliberate regression demonstrated this failure. I replaced
the light Primary role’s palette reference with a fixed teal HEX, then changed the CSS palette. The connected Active chip became pale purple, while the payment button stayed teal.

A single file is useful organisation. A single source of truth
also needs clear ownership, maintained references, repeatable
updates, and checks that detect exceptions.