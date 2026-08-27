# gpl-licensing-fork

QUERY: GPL v2 v3 licensing implications forking Mixxx commercial open core AGPL choice

## Synthesized answer
Mixxx is released under GPL v2, which means any fork that distributes the Mixxx code or a binary that includes it must also be licensed under GPL v2; you cannot add proprietary code that is linked with the core without violating the license, though you may keep separate, clearly demarcated add‑on modules under a commercial license if they communicate with the GPL‑v2 core only via an external interface. Re‑licensing the existing Mixxx code to GPL v3 or AGPL v3 would require the consent of every copyright holder, so without that permission you are confined to GPL v2. GPL v3 adds an explicit patent grant, anti‑tivoization provisions, and Apache‑2.0 compatibility, which many businesses find reassuring, while AGPL v3 extends the copyleft to network use, forcing anyone who offers the software as a SaaS service to publish their source. For an open‑core commercial model you can keep the core under GPL v2 (or, if you obtain consent, GPL v3/AGPL v3) and sell a separate commercial license for proprietary extensions, but the core itself must remain freely available under the original GPL terms, and using AGPL will likely limit adoption because many companies have policies that block AGPL‑licensed components.

## Sources

### We Love GPLv3, but Are Switching License to Apache 2.0 | Hacker News
URL: https://news.ycombinator.com/item?id=25346965
AGPL was created to prevent this and further protect the USERS right, as it forced anyone who chose to use AGPL software and offer it as a service, to share their source code.

I still believe GPL / AGPL is the BEST open-source license. All developers are also USERS of their application. Thus, GPL's focus to protect the USERS right at all cost, works to protect your rights as a developer too as your source code, in any form, will always be open and available.

For commercial open source projects, dual license (partially or fully closed + GPL) is the way to go. MySQL / MariaDB is a good example.

This is where AGPL comes in too. [...] AGPL was created to prevent this and further protect the USERS right, as it forced anyone who chose to use AGPL software and offer it as a service, to share their source code.

I still believe GPL / AGPL is the BEST open-source license. All developers are also USERS of their application. Thus, GPL's focus to protect the USERS right at all cost, works to protect your rights as a developer too as your source code, in any form, will always be open and available.

For commercial open source projects, dual license (partially or fully closed + GPL) is the way to go. MySQL / MariaDB is a good example. [...] AGPL was created to prevent this and further protect the USERS right, as it forced anyone who chose to use AGPL software and offer it as a service, to share their source code.

I still believe GPL / AGPL is the BEST open-source license. All developers are also USERS of their application. Thus, GPL's focus to protect the USERS right at all cost, works to protect your rights as a developer too as your source code, in any form, will always be open and available.

For commercial open source projects, dual license (partially or fully closed + GPL) i ...

### Open-core concerns - Page 2 - Feedback
URL: https://community.baserow.io/t/open-core-concerns/1467?page=
GPLv2 is incompatible with the GPLv3 license. GPLv2 allows a process called “tivozation”, which includes proprietary code. multi-licensed. 3,

### Revisiting the Open Source Business Model – Copyleft Currents
URL: https://heathermeeker.com/2018/06/24/revisiting-the-open-source-business-model
Historically, dual licensing models were almost always implemented with GPL2 as the open source choice; most other licenses lack the conditions to drive private businesses to the proprietary licensing choice.  Once GPL3 and AGPL3 were released, those licenses took their place as part of the dual licensing model, because they imposed more conditions on the exercise of the license than GPL2.

### Open Source Software Licenses 101: GPL v3 | FOSSA Blog
URL: https://fossa.com/blog/open-source-software-licenses-101-gpl-v3
The GPL v3 license permits users of the code to:

 Use the code for commercial purposes: Like GPL v2, GPL v3 allows for use of the licensed code in commercial software.
 Change the code: Users can change or rework the code, but if they distribute these changes/modifications in binary form, they’re also required to release these updates in source code form under the GPL v3 license.
 Distribute copies or modifications of the code: As long as these modifications are also released under the GPL v3 license, they can be distributed to others.
 Place warranty: Distributors of the original code can offer their own warranty on the licensed software. [...] ### What's the difference between GPL v3 and GPL v2?

Key differences include: GPL v3 has an explicit grant of patent rights from contributors, is compatible with Apache License 2.0, protects against tivoization (devices that prevent users from running modified software), requires installation information for consumer devices, and has improved internationalization. GPL v2 does not address these issues.

### Can I use GPL v3-licensed code in commercial software?

Yes, you can use GPL v3-licensed code in commercial software and charge money for it. However, you must make the source code available to anyone who receives the software, and any modifications must be released under the GPL v3 license.

### Do I need to share my modifications to GPL v3-licensed code? [...] If you can’t decide which to choose, you can also use GPL v2 or any later version, which at this time includes GPL v2 or GPL v3.

### For Companies

For software organizations, a major differentiator between the two GPLs is the express grant of patent rights. Lawsuits are something no company wants, and the explicit patent grant included in GPL v3 provides legal prot ...

### Dual Licensing vs. Open Core: Legal Distinctions Every Business Should Understand - TermsFeed
URL: https://www.termsfeed.com/blog/dual-licensing-vs-open-core
The legal maintenance burden is usually lighter than dual licensing because you're not enforcing copyright boundaries for every commercial exception; you're simply licensing add-ons.

The legal trade-off is maintaining strict architectural boundaries that separate your proprietary features from the core. You also risk bigger players and competitors forking your open source core and building competing products around it.

Redis Labs faced this problem when cloud providers offered managed Redis services using their open core without contributing revenue back, which ultimately pushed the company to relicense under a source-available model.

Redis AGPLv3 Open Source License [...] Redis AGPLv3 Open Source License

Your choice ultimately hinges on your competitive moat. If your differentiation comes from the core technology itself, dual licensing protects it. If your moat is execution, integration, or services around the core, open core lets you maximize adoption while monetizing operational value.

## Summary

Choosing between dual licensing and open core is a legal decision that shapes your copyright obligations and your relationship with contributors. To recap: [...] ### Choose dual licensing when you need strong control.

Dual licensing works best for developer-first products (databases, SDKs, infrastructure tools) where competitors can monetize your work by hosting it as a service.

Many companies adopt the AGPL specifically for this reason. Pairing AGPL, which triggers copyleft obligations even for network use, with a commercial license forces competitors to either release their modifications or pay you.

MySQL's success with this model shows its viability. Companies that build proprietary applications pay Oracle rather than expose their source code under the GPL terms. ...

### Open Core Ventures — We build commercial open source
URL: https://opencoreventures.com/insights/agpl-license-is-a-non-starter-for-most-companies
> “The AGPLv3 was a terrible success, especially among the startup community that found the perfect base license to make dual licensing with a commercial license feasible. MongoDB, RethinkDB, OpenERP, SugarCRM as well as WURFL all now utilize the AGPLv3 as a vehicle for dual commercial licensing. The AGPLv3 makes that generally easy to accomplish as the original copyright author has the rights to make a commercial license possible but nobody who receives the sourcecode itself through the APLv3 inherits that right.” - Armin Ronacher, Licensing in a Post Copyright World [...] The complications with AGPL go beyond companies not incorporating AGPL-licensed code into their own codebases. Many corporations will forbid end-users from installing any AGPL-licensed code on corporate devices out of an abundance of caution. This means that not only are libraries affected, but software end-user adoption has a significant hurdle.

Not all businesses are going to default to all open source. While acceptance of open source has hugely grown, trying to force the AGPL risks causing a backtracking from open source, making software less open, not more open.

← All insights [...] One of the major problems with the additional text is that it is vague. It only specifies how GPL and AGPL licensed code works together, but not other licenses. It also doesn’t specify what qualifies as access, stating only that “users interacting with it remotely through a computer network” are guaranteed access to the source code. When incorporated into a company’s codebase, it’s unclear what other code may be exposed to the virality of the license. The fear is that a company could be forced into open-sourcing software that was not intended to be open source.

## AGPL restrictions make compliance hard, hindering c ...

### AGPL, MIT, GPL, Apache 2.0, and What Each Means for Your ...
URL: https://www.opensourcealternatives.to/blog/open-source-license-guide
#### Watch-Outs

 Many companies have internal policies banning AGPL dependencies without legal review, because engineers underestimate the network-use trigger
 AGPL is compatible with GPL v3 for incorporation (AGPL code can incorporate GPL v3 code), but distributing AGPL code under only the GPL v3 is not permitted (AGPL imposes stricter obligations)
 The "commercial exception" model: many AGPL projects offer an AGPL community edition alongside a commercial license for companies that want to run modified versions as services without releasing changes. This is the standard open core business model.

#### Best For [...] Choose Apache 2.0 if: you want MIT-level permissiveness but your users operate in environments where patent protection matters. You want enterprise and regulated-industry adoption. Your contributors may hold relevant patents.

Choose GPL v3 if: you want derivatives to remain open source when distributed, but you are comfortable with the SaaS loophole. Your software is a desktop application, command-line tool, or developer utility that users run locally.

Choose AGPL v3 if: you want derivatives to remain open source even when run as a network service. You are building a web application or SaaS tool and want commercial hosting providers to contribute modifications back. You accept that this may limit adoption among companies with strict policies against AGPL. [...] Open Source Alternatives LogoOpen Source Alternatives

AlternativesBlogAdvertise

Open Source Alternatives LogoOpen Source Alternatives

### Stay Updated

Subscribe to our newsletter for the latest news and updates aboutAlternatives

Open Source Licenses Explained: AGPL, MIT, GPL, Apache 2.0, and What Each Means for Your Project blog thumbnail image

# Open Source Licenses Explained: AGPL, MIT, GP ...

### On the AGPL license and the idea to move away from it - Feedback - Logseq
URL: https://discuss.logseq.com/t/on-the-agpl-license-and-the-idea-to-move-away-from-it/14716
Most of the time the point is licensing with a Copyleft license so that everyone can use that software without turning it into something proprietary and at the same time selling commercial licenses to someone else that for whatever reason can’t comply with the Copyleft one.

If one buys a commercial license for example they are making use of the software according to that license only and they can ignore the licenses other people have.

But in theory nothing stops you from licensing some software both as MIT and GPL. It wouldn’t make sense, of course.

See: Multi-licensing - Wikipedia

R Studio is an example of desktop application released as AGPL but with also a commercial license:

### Posit [...] If they will switch to a permissive license and I hear monetization complaints, I’ll be sure to point out that it was their choice to opt out of the dual licensing option.

Same if an alternative Roam/Tana appears but based on Logseq and whose changes will remain closed source: it will be just their fault.

Logseq userbase mostly doesn’t care about Logseq being FOSS, local etc. They will switch to something like Roam/Tana but based on Logseq and improved if they have the chance. This can easily become the end of Logseq.

Again, this is what they tell you, I explained what is really going on. [...] As I said, a company like Google is perfectly capable to perform a check in CI to avoid accidents, instead, they (legitimately) decided to forbid AGPL licensed software to be run and this is fine as far as they are willing to pay commercial licenses without complaining: people working at Google must pretend it to buy the commercial licenses for them because it’s Google’s very preventive policy that is making them a requirement.

I think people working for such companies are not ful ...

