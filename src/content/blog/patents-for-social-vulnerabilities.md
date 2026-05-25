---
author: franklin
date: 2024-07-12
lang: en
title: "Patents For Social Vulnerabilities: A Modest Proposal For Turning Criminals Into Consultants"
translationKey: social-vulnerabilities
description: "What if we treated social engineering techniques like software bugs — disclosable, ownable, tradeable?"
tags: ["security", "social engineering", "policy", "patents", "economics"]
---

I've been trying to find the flaw in this idea for about three days and I keep failing, which usually means I'm either missing something obvious or the idea is actually good. I'm not sure which.

The idea: treat social engineering techniques as patentable intellectual property.

Before I explain why I can't dismiss this, let me admit what draws me to it in the first place. I work in public administration. I've seen the scripts. Someone calls claiming to be from the Tribunal de Contas, urgent, needs to confirm some wire transfer. Someone impersonates a federal inspector. The "motoboy" variation — a physical messenger shows up to collect your card "for analysis." These aren't random; they're refined. They have been iterated over thousands of calls until the conversion rate stabilized. Somebody knows exactly which words make the cortisol spike and which make it drop. That knowledge is the vulnerability. And we only ever learn about it from the victims, after the fact.

Software has CVEs. The [Common Vulnerabilities and Exposures database](https://www.cve.org/) exists because someone decided that coordinated disclosure was better than the alternative — which is that every security team discovers the same bug independently while attackers exploit it at scale. The patch arrives faster when the bug has a name. There's no equivalent for human vulnerabilities.

## A third option

A researcher — or, yes, a former criminal — documents a repeatable social vector: the specific psychological triggers, execution steps, target demographics. Files it. The filing is published immediately; the patent application _is_ the disclosure. Corporations license the patent to build training and defenses. The researcher earns royalties from defensive licensing.

The black hat currently has two options: exploit the vulnerability (high reward, high risk), or disclose it for free (zero reward). This adds a third: patent the vulnerability. Zero risk, high reward.

And this is where it gets strange, which is also where I suspect the flaw might be hiding.

If a criminal later deploys the patented technique without a license, they face not just fraud charges but patent infringement — asset seizure, civil liability, the whole machinery that goes after IP violations. You'd be able to pursue the infrastructure of social engineering operations the way you can pursue software piracy networks. In theory.

I genuinely don't know if this works in practice. A few things I'm uncertain about:

The prior art problem: if a technique is already in circulation before anyone patents it, does the patent hold? If not, the only patentable techniques are the novel ones — which is a small slice of the threat landscape. Most social engineering is variations on themes that have been running since Ponzi. The prior art for "pretending to be your bank's fraud department" is all of recorded telephone history. The search is infinite.

The enforcement asymmetry: patent infringement suits work when defendants have assets. Criminal operations that subsist on social engineering are often structured specifically to avoid holding assets. You'd be suing ghosts.

The knowledge problem: who verifies that a disclosed technique is genuine and distinct? Patent examiners assess novelty by searching prior art. The prior art for social engineering is scattered across police reports, victim testimonies, security conference talks, and lore. There is no corpus.

None of these kill the idea, exactly. They make it hard. The prior art problem might be solvable with a tiered system that doesn't require full novelty, just first _documented_ articulation. The enforcement asymmetry is real but patent infringement isn't the only enforcement mechanism — you could use it as an additional tool against the ones who do have assets: platforms, infrastructure providers, payment processors, money mules with accounts. The knowledge problem is a version of the same problem CVE has, and CVE functions anyway, imperfectly, which is better than not at all.

What keeps me returning to this is the incentive structure. Right now there is no legitimate market for the knowledge that social engineers possess. That knowledge gets sold on dark forums or used directly. Creating a legitimate market — even a strange one that involves IP rights over attack patterns — changes the rational calculus at the margin. Some people at the margin would take the legitimate route. Probably not most people. Margins are margins.

The Brazilian Pix ecosystem has been a laboratory. Social engineering attempts increased dramatically after 2021 because the payment system worked — if you could trick someone into initiating a transfer, the money moved instantly and irreversibly. The response was fraud detection at the platform level, regulatory pressure on banks, and occasional criminal prosecution. No systematic collection of the scripts being used. We learn from victims, one by one, after the fact.

A disclosure system — patent or otherwise — would at least create a taxonomy. And taxonomies, even imperfect ones, are how you scale defense.

I still haven't found the flaw. But I'm watching for it.
