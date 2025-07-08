---
author: scottalexander
date: 2024-07-12
title: Patents For Social Vulnerabilities: A Modest Proposal For Turning Criminals Into Consultants
---

## I.

In 1798, Edward Jenner received a patent for smallpox vaccination. This was controversial - he was literally patenting the process of deliberately infecting people with disease. Critics called it "playing God" and "monetizing human suffering." The Royal College of Physicians was skeptical. Anti-vaxxers (yes, they existed) were outraged.

But here's what's funny: Jenner's patent didn't give him exclusive rights to *prevent* smallpox. It gave him exclusive rights to a specific *method* of prevention. Anyone could still develop alternative vaccines, quarantine systems, or treatment protocols. They just couldn't use Jenner's exact cowpox inoculation technique without compensating him.

This seems obviously correct in retrospect. Jenner invested time and risk to develop something beneficial. Society gets the benefit (disease prevention) plus the detailed knowledge (published patent specifications), and Jenner gets temporary monopoly profits as reward. Everyone wins, dead smallpox victims most of all.

So here's my question: why don't we do this for social engineering attacks?

## II. The Current Situation Is Insane

Right now, someone discovers a new way to trick people into giving up their passwords. Let's call it the "Urgent IT Security Update" phone scam. Here's what happens:

1. Criminal uses technique successfully for months/years
2. Eventually victims complain to authorities  
3. Authorities issue warnings after significant damage is done
4. Other criminals copy the technique from news reports
5. Technique spreads until countermeasures finally emerge
6. Cycle repeats with new technique

This is *exactly backwards*. We're incentivizing secrecy at the worst possible time - when keeping the technique secret maximizes harm. And we're sharing information at the worst possible time - after damage is done and criminals have already proven it works.

Compare this to computer security, where we've mostly solved this problem. Security researchers compete to find vulnerabilities first, then responsibly disclose them to vendors. They get bug bounties, conference talks, and resume lines. Meanwhile, exploiting the vulnerabilities maliciously gets you federal prison time.

But for social engineering? We have no equivalent system. There's no "CVE database for human vulnerabilities." No bug bounty programs for organizational weaknesses. No way for ethical researchers to get paid for discovering that "employees will give you building access if you wear a uniform and carry a clipboard."

## III. Enter: The Social Vulnerability Patent System

Here's the proposal that's either brilliant or insane (jury's still out):

**Create a patent-like system for social engineering techniques, where the "inventor" gets legal protection and royalties, but only if they publish the complete methodology for defensive purposes.**

How it works:

1. Researcher discovers new social engineering vector (e.g., "Fake Zoom IT Support Scam #47")
2. Files detailed patent application describing the technique, psychological principles, target demographics, success rates, etc.
3. Patent office publishes the application for public review
4. Security teams, companies, and trainers can immediately develop countermeasures
5. Anyone can use the technique for legitimate red teaming, education, or research
6. But using it for actual fraud triggers automatic royalty payments to the patent holder - ON TOP OF criminal penalties

## IV. Wait, This Actually Makes Sense

The beautiful thing is how the incentives align:

**For researchers:** You get paid for finding vulnerabilities before criminals do. Like bug bounties, but for human bugs.

**For criminals:** Using patented techniques becomes economically stupid. You're paying licensing fees to your victim's defender while also risking prison.

**For defenders:** You get early warning about new attack vectors, plus detailed technical specs for building countermeasures.

**For society:** Vulnerabilities get discovered and patched by good guys instead of exploited in secret by bad guys.

It's essentially converting social engineering from a "security through obscurity" problem into an "open source security" solution.

## V. But What About The Obvious Objections?

**"This creates a manual for criminals!"**

We already have manuals for criminals. They're called "news reports about the latest scam." The difference is those come *after* people get hurt. This gives us the manual *before* anyone gets hurt, plus legal weapons to use against copycats.

**"You're incentivizing people to think up new scams!"**

We're incentivizing people to think up new scams *and immediately give us detailed instructions for stopping them*. Currently people think up new scams and keep the defensive information secret until after they've done maximum damage.

**"Patents reward inventors, but these techniques harm people!"**

So does chemotherapy. So do vaccines (in the immediate term). So does surgery. We patent beneficial applications of harmful processes all the time. The question isn't whether the technique can cause harm - it's whether the patent system channels that technique toward beneficial use.

**"This is basically legal fraud!"**

No, this is basically legal *fraud research*. Filing a patent requires no actual victims. It's documenting a vulnerability, not exploiting it. Like how filing a computer security CVE doesn't mean you hacked anyone.

## VI. Historical Precedent: We've Done This Before

During WWII, the British deliberately leaked fake invasion plans for D-Day. They wanted the Germans to *know* about their "secret" plan to invade Calais. The real plan (Normandy) stayed secret.

This is the same principle: weaponizing information disclosure. Make your fake information more appealing to discover than your real information.

In our case: make it more profitable to patent social engineering techniques than to use them criminally. The patents become honeypots that attract technique development while simultaneously neutralizing the techniques.

## VII. Implementation Details That Matter

**Patent term:** Maybe 2-3 years instead of 20. Social engineering techniques have shorter lifespans than mechanical inventions.

**Prior art:** Existing scams enter public domain immediately. Can't patent the Nigerian Prince email.

**Defensive licensing:** Patent holders must license for red teaming, training, and research at reasonable rates (or free).

**Enforcement:** Royalty collection could be automatic - like how ASCAP collects music royalties. When someone gets convicted of fraud using a patented technique, the court includes licensing fees in restitution.

**International coordination:** Like other IP treaties, but focused on information sharing rather than profit protection.

## VIII. The Bigger Picture

This is really about changing the fundamental economics of information security.

Right now, valuable security information follows a "cathedral" model - small groups of people (criminals or security teams) hoard knowledge for competitive advantage. This creates brittleness. When the cathedral falls, everyone's vulnerable.

The patent system forces a "bazaar" model - security information gets developed openly, with many eyes making vulnerabilities shallow. It converts information hoarding from a competitive advantage into a competitive disadvantage.

It's also about acknowledging that social engineering is a legitimate field of study that currently has no legitimate career path. We have penetration testers, but no "social penetration testers." We have red teams for technical systems, but not for human systems. This creates an artificial scarcity of defensive knowledge.

## IX. The Ethical Use Defense: Keeping Patent Holders Honest

But wait, there's a crucial safeguard we need to add. What happens if patent holders start acting like patent trolls, demanding royalties from legitimate security researchers?

**Solution: The Ethical Use Exemption with Teeth**

Here's the additional mechanism: **If you use a patented social engineering technique for demonstrably ethical purposes, you can sue the patent holder if they try to collect royalties.**

This creates a beautiful symmetry:
- Patent holders can sue people who use techniques maliciously
- Ethical users can sue patent holders who abuse the system

**What counts as "ethical use":**
- Red team assessments with explicit client consent
- Security training with volunteer participants  
- Academic research with IRB approval
- Penetration testing within contracted scope
- Educational demonstrations with disclosure

**What this means in practice:**

Imagine MegaCorp's security consultant patents "The Fake Badge Tailgating Technique." Later, they demand $10,000 from a university researcher who used the technique (with student consent) to study building security.

Under our system, the researcher can countersue MegaCorp for abuse of patent rights. If the court finds the use was genuinely ethical, MegaCorp pays the researcher's legal fees PLUS damages for frivolous enforcement.

## X. Why This Ethical Backstop Is Crucial

This creates **economic punishment for patent abuse**. Right now, patent trolls can threaten lawsuits because fighting back is expensive even when you're right. Our system flips this - abusing social vulnerability patents becomes expensive for the patent holder.

It also **preserves the research ecosystem**. We want security researchers to feel safe using patented techniques for legitimate purposes. The ethical use defense ensures that patents enhance security research rather than stifling it.

**The precedent exists:** This is similar to DMCA safe harbors, fair use doctrine, and anti-SLAPP laws. We regularly create legal mechanisms that punish people for abusing IP rights against legitimate users.

## XI. Implementation: The Ethics Review Board

Who decides what's "ethical use"? We could create specialized courts with technical expertise, similar to patent courts. Or better yet:

**Community-driven ethics review:** Major security organizations (like (ISC)² or SANS) could maintain public databases of pre-approved ethical use cases. If your use case matches an approved template, you're automatically protected.

Think of it like Creative Commons licenses, but for security research. "This technique is licensed under Social Engineering Commons - Attribution, Defensive Use Only."

## XII. The Full Incentive Structure

Now our system has three layers of protection:

1. **Criminal penalties** for malicious use (existing law)
2. **Royalty payments** to patent holders for unauthorized malicious use (new)  
3. **Legal liability** for patent holders who abuse ethical users (new)

This creates a Nash equilibrium where:
- Researchers want to patent techniques (they get paid, plus protection from abuse)
- Criminals avoid patented techniques (double financial penalty)
- Patent holders police themselves (abuse is expensive)
- Ethical users feel safe (strong legal protection)

## XIII. Conclusion: The Jenner Test, Revised

Let's update our three criteria for Edward Jenner's vaccine patent:

1. **Personal incentive to develop beneficial innovation** ✓
2. **Required public disclosure of methods** ✓  
3. **Legal framework preventing harmful misuse** ✓
4. **Legal framework preventing beneficial blocking** ✓ (NEW)

The ethical use defense ensures that our social engineering patent system can't be weaponized against the very people we're trying to help. It's the difference between "patents for security research" and "patents that accidentally kill security research."

Plus it gives us the delightful prospect of watching patent lawyers argue about whether using the "Urgent IT Security Update" scam to test your company's phone security procedures constitutes fair use under the Beneficial Social Engineering Research Exception.

I really, really want to see that oral argument.

---

*Scott Alexander writes Astral Codex Ten and occasionally has ideas that are either brilliant or terrible, but never boring. This may be one of those times.*
