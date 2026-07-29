import type { ReadingItem } from "@/components/ProjectWalkthrough";
import type { TerminalLine } from "@/components/TerminalBlock";

export interface ToolDoc {
  slug: string;
  name: string;
  eyebrow: string;
  intro: string;
  repo: string;
  liveHref?: string;
  liveLabel?: string;
  language: string;
  /** Layman's explanation, one paragraph per entry. */
  plain: string[];
  /** The problem it exists to solve, in one sentence. */
  problem: string;
  quickstart: TerminalLine[];
  sampleLabel: string;
  sample: string;
  reading: ReadingItem[];
  howItWorks: Array<{ title: string; body: string }>;
  practical: string[];
  safety: string;
  verified: string[];
  stack: string[];
}

export const TOOL_DOCS: Record<string, ToolDoc> = {
  threatlens: {
    slug: "threatlens",
    name: "ThreatLens",
    eyebrow: "Threat intelligence",
    intro:
      "Classify a suspicious address, domain, or file fingerprint, score how dangerous it looks, and map it to known attacker behavior — entirely offline.",
    repo: "https://github.com/Ibby111GT/threatlens",
    language: "Python 3 (standard library only)",
    plain: [
      "When something suspicious shows up in a security alert, it usually arrives as a bare scrap of information: an IP address, a website domain, or a long string of letters and numbers that fingerprints a file. Those scraps are called indicators of compromise, or IOCs. On their own they mean nothing — the analyst has to work out what kind of thing it is and whether it should be worried about.",
      "ThreatLens does that first pass automatically. You hand it the scrap, it works out what kind of indicator it is, scores how suspicious it looks, and explains its reasoning in plain terms. It runs entirely on your own machine with no subscription and no API key, so it also works in environments that are not allowed to send data to outside services.",
    ],
    problem:
      "Analysts waste time manually looking up every suspicious address and file that crosses their desk, and most commercial tools charge for it or require sending the data to a third party.",
    quickstart: [
      {
        command: "git clone https://github.com/Ibby111GT/threatlens && cd threatlens",
        comment: "No install step — it uses only Python's built-in library",
      },
      {
        command: "python3 threat_intel.py --demo",
        comment: "See it work on a bundled set of example indicators",
      },
      {
        command: "python3 threat_intel.py --ioc kq3v9z7x1p0m4w.tk",
        comment: "Check one specific indicator",
      },
      {
        command: "python3 threat_intel.py --file iocs.txt --output results.json",
        comment: "Score a whole list and export it for a SIEM",
      },
    ],
    sampleLabel: "Real output — python3 threat_intel.py --ioc kq3v9z7x1p0m4w.tk",
    sample: `[DOMAIN] kq3v9z7x1p0m4w.tk
  score    : 85/100  CRITICAL
  ATT&CK   :
    T1071  Application Layer Protocol  [Command and Control]
  note     : Suspicious TLD .tk commonly abused for phishing/malware.
  note     : Domain resembles algorithmically generated (DGA) name.`,
    reading: [
      {
        label: "[DOMAIN]",
        body: "The kind of indicator it worked out on its own. It also recognizes IP addresses, web links, file fingerprints, email addresses, and CVE vulnerability IDs.",
      },
      {
        label: "score 85/100 CRITICAL",
        body: "How suspicious it looks overall, and the band that score falls into. The bands run INFO, LOW, MEDIUM, HIGH, CRITICAL so you can sort a list by what to handle first.",
      },
      {
        label: "ATT&CK T1071",
        body: "A reference into MITRE ATT&CK, the industry's shared catalogue of attacker techniques. T1071 means 'the attacker is hiding its remote-control traffic inside normal-looking web traffic'.",
      },
      {
        label: "Suspicious TLD",
        body: "The domain ends in .tk, one of a handful of endings given away for free and therefore heavily used for throwaway phishing sites.",
      },
      {
        label: "DGA-like name",
        body: "The name looks machine-generated rather than chosen by a human. Malware often generates thousands of random-looking domain names so defenders cannot block them all in advance.",
      },
    ],
    howItWorks: [
      {
        title: "Work out what the indicator is",
        body: "Pattern rules identify whether the input is an IPv4/IPv6 address, a domain, a URL, an MD5/SHA1/SHA256 file hash, an email address, or a CVE identifier — so the right checks get applied.",
      },
      {
        title: "Score it with offline heuristics",
        body: "Each type starts from a base score, then signals adjust it: a suspicious top-level domain adds risk, a machine-generated-looking name adds more, and an internal private address is forced down because it is your own network, not the internet.",
      },
      {
        title: "Spot machine-generated names",
        body: "It measures character randomness, long runs of consonants, and vowel ratio. Human-chosen domains look different from algorithm-generated ones, and those numbers separate them.",
      },
      {
        title: "Map it to attacker behavior",
        body: "A bundled offline table links the indicator to MITRE ATT&CK techniques and tactics, so the output says what an attacker would be doing with it rather than just how bad it is.",
      },
      {
        title: "Fold in a live reputation check, optionally",
        body: "If you supply a free VirusTotal key it adds that verdict to the score. If the lookup fails, is rate-limited, or you never provide a key, it falls back to the offline score instead of breaking.",
      },
    ],
    practical: [
      "A security analyst pastes in the indicators from an alert and immediately sees which one to chase first, instead of opening five browser tabs.",
      "An incident responder feeds in a list pulled from a compromised machine and exports the scored results straight into a SIEM as JSON.",
      "Teams in restricted environments — government, healthcare, finance — get triage without sending potentially sensitive indicators to an outside service.",
    ],
    safety:
      "Everything runs locally by default and no data leaves your machine. The only outbound connection possible is the optional VirusTotal lookup, which happens solely when you pass your own API key.",
    verified: [
      "python3 -m unittest discover -s tests → 10 tests, all passing",
      "python3 threat_intel.py --demo → scores the full bundled indicator set",
      "python3 threat_intel.py --ioc 8.8.8.8 --json → valid single-line JSON",
    ],
    stack: ["Python 3", "Zero dependencies", "MITRE ATT&CK", "JSON export"],
  },
  netrecon: {
    slug: "netrecon",
    name: "NetRecon",
    eyebrow: "Network security",
    intro:
      "Find out which network services a machine is exposing, what software is answering, and whether anything is open that should not be.",
    repo: "https://github.com/Ibby111GT/netrecon",
    language: "Python 3 (standard library only)",
    plain: [
      "Every computer on a network has thousands of numbered doors called ports. Each one can have a piece of software listening behind it — a website on port 443, a remote login service on port 22, a database on port 3306. Most should be shut. The ones left open by accident are where intrusions typically begin.",
      "NetRecon knocks on those doors and reports which ones answer. When something does answer, it records the greeting the service sends back, which usually names the software and version. The useful question is never just 'is anything open' — it is 'is everything that is open supposed to be open, patched, and reachable only by the people who need it'.",
    ],
    problem:
      "Organizations lose track of what their machines expose to the network, and a forgotten open service running old software is one of the most common ways attackers get their first foothold.",
    quickstart: [
      {
        command: "git clone https://github.com/Ibby111GT/netrecon && cd netrecon",
        comment: "No install step — pure standard library",
      },
      {
        command: "python3 scanner.py --demo",
        comment:
          "Safe demo: starts two listeners inside its own process on your own machine, then finds them",
      },
      {
        command: "python3 scanner.py -t 127.0.0.1 --ports 22,80,443",
        comment: "Scan specific ports on a host you are authorized to test",
      },
      {
        command: "python3 scanner.py --demo --output report.json",
        comment: "Save results as JSON",
      },
    ],
    sampleLabel: "Real output — python3 scanner.py --demo",
    sample: `========================================================
  NetRecon — TCP Port Scanner
  Target  : 127.0.0.1
  Ports   : 7 to probe
  Threads : 200
========================================================

  127.0.0.1 (localhost)
  39403  OPEN      unknown  SSH-2.0-NetRecon_Demo
  43875  OPEN      unknown  HTTP/1.0 200 OK Server: NetRecon-Demo/1.0

--------------------------------------------------------
  Scan complete in 0.26s
  Target     : 127.0.0.1
  Open ports : 2`,
    reading: [
      {
        label: "39403 / 43875",
        body: "The port number that answered. In the demo these are randomly assigned each run, which is why the numbers change — they are the two listeners the demo started for itself.",
      },
      {
        label: "OPEN",
        body: "Something is actively listening and accepted the connection. The other states are FILTERED, meaning a firewall silently dropped the attempt, and closed, which is not printed because it is the normal case.",
      },
      {
        label: "SSH-2.0-NetRecon_Demo",
        body: "The banner — the greeting the service sent back. On a real system this typically names the exact software and version, which tells you what needs patching.",
      },
      {
        label: "Threads: 200",
        body: "How many ports it checks at once. Scanning one at a time would take hours, so it runs many probes in parallel.",
      },
      {
        label: "OS hint",
        body: "An educated guess at the operating system, based on the combination of services found — a machine with remote desktop open is probably Windows, one with SSH is probably Linux.",
      },
    ],
    howItWorks: [
      {
        title: "Validate the target first",
        body: "It refuses malformed addresses, ports outside 1-65535, and any range wider than /22 — about a thousand addresses — so a typo cannot start an enormous scan by accident.",
      },
      {
        title: "Expand the target into a host list",
        body: "A single address stays one host; a CIDR range like 192.168.1.0/30 expands into the individual addresses inside it.",
      },
      {
        title: "Probe ports in parallel",
        body: "A thread pool attempts a TCP connection to each port. A completed handshake means open, a refusal means closed, and a timeout means a firewall is dropping traffic silently — reported as filtered.",
      },
      {
        title: "Grab the banner",
        body: "For each open port it reads whatever the service announces, and sends a minimal HTTP request first on web ports so they have something to reply to.",
      },
      {
        title: "Summarize and export",
        body: "Results are sorted by port with a run summary, and can be written to JSON for tracking changes between scans.",
      },
    ],
    practical: [
      "An IT team scans its own servers before an audit to confirm nothing unexpected is exposed to the internet.",
      "A security engineer re-scans after a change to verify a firewall rule actually took effect, rather than trusting the config file.",
      "Anyone learning networking can run the demo to see, concretely, what a port scan is and what its output means.",
    ],
    safety:
      "The demo only ever touches your own machine's loopback address and refuses to run against anything else. Port scanning systems you do not own or have written permission to test may be illegal — the tool ships with that warning and the README repeats it.",
    verified: [
      "python3 -m unittest discover → 44 tests, all passing",
      "python3 scanner.py --demo → finds both self-started listeners with banners",
      "Invalid target, oversized range, and bad thread count all exit cleanly with an explanation",
    ],
    stack: ["Python 3", "Threading", "Raw sockets", "JSON export"],
  },
  webrecon: {
    slug: "webrecon",
    name: "WebRecon",
    eyebrow: "Web security",
    intro:
      "Read the security configuration a website publishes to every visitor, and report what is missing, weak, or about to expire.",
    repo: "https://github.com/Ibby111GT/webrecon",
    language: "Python 3 (standard library only)",
    plain: [
      "Every website hands your browser a set of instructions alongside the page itself. They say things like 'only ever connect to me securely', 'do not let another site frame my pages', and 'do not run scripts loaded from anywhere else'. These instructions are public — your browser reads them on every visit.",
      "WebRecon reads those same instructions and tells you which ones are missing or written badly, then checks the site's encryption certificate for expiry and outdated protocols. Checking whether a shop locked its front door is not the same as breaking in: this tool only looks at what a site volunteers to every visitor, and never sends an attack payload at anything.",
    ],
    problem:
      "Most website security headers are a one-line configuration change, but they are invisible unless someone deliberately looks — so they stay missing for years, and certificates quietly expire on a weekend.",
    quickstart: [
      {
        command: "git clone https://github.com/Ibby111GT/webrecon && cd webrecon",
        comment: "No install step — pure standard library",
      },
      {
        command: "python3 web_scanner.py --demo",
        comment: "Replays a bundled synthetic response — no internet needed",
      },
      {
        command: "python3 web_scanner.py --target https://example.com",
        comment: "Inspect a site you are authorized to test",
      },
      {
        command: "python3 web_scanner.py --target https://example.com --checks headers --output report.json",
        comment: "Run one check family and save JSON",
      },
    ],
    sampleLabel: "Real output — python3 web_scanner.py --demo",
    sample: `https://demo.internal.example  [HIGH]
  checks   : headers, tls
  findings : high 2  medium 4  low 4  info 2

  [HIGH] Certificate expires soon
      saw    : 11 days remaining (expires 2026-08-09)
      why    : An expiry that lands on a weekend takes the site
               offline until someone notices.
      fix    : Renew now and set up automated renewal

  [MEDIUM] CSP allows inline script
      saw    : Content-Security-Policy contains 'unsafe-inline'
      why    : Allowing inline script removes most of the
               protection CSP is there to provide.
      fix    : Drop 'unsafe-inline' and move to nonces or hashes`,
    reading: [
      {
        label: "[HIGH] next to the address",
        body: "The headline severity — simply the most serious actionable finding for that site, so you can triage a list of targets at a glance.",
      },
      {
        label: "saw / why / fix",
        body: "Every finding carries the exact evidence that triggered it, a plain-English explanation of the risk, and one concrete change to make. No finding is left as a bare label.",
      },
      {
        label: "Severity ladder",
        body: "CRITICAL means fix today, HIGH means this week, MEDIUM is a real gap to schedule, LOW is hardening, and INFO is context rather than a problem.",
      },
      {
        label: "Content-Security-Policy",
        body: "The rule that says which sources of code a page may run. It is the main defence that stops an injected script from stealing accounts — and 'unsafe-inline' switches most of that protection off.",
      },
      {
        label: "Certificate expiry",
        body: "The padlock in the address bar is backed by a certificate that expires. When it lapses, every visitor gets a full-page browser warning and the site is effectively down.",
      },
    ],
    howItWorks: [
      {
        title: "Fetch once, judge separately",
        body: "Retrieving the page and analyzing it are deliberately different functions. The judgement logic is pure, which is why the whole test suite and the demo run with no network connection at all.",
      },
      {
        title: "Check headers for presence and quality",
        body: "Six security headers are checked for existence, then the ones that are present are checked for weak values — a short HSTS lifetime, a policy with wildcards, a header set to something browsers ignore.",
      },
      {
        title: "Review cookie flags",
        body: "Every Set-Cookie is parsed for the three flags that keep a session cookie from being stolen or leaked: Secure, HttpOnly, and SameSite.",
      },
      {
        title: "Inspect the certificate",
        body: "It connects, reads the presented certificate, and reports issuer, expiry with days remaining, and the negotiated protocol — flagging anything expired, near expiry, unverifiable, or older than TLS 1.2.",
      },
      {
        title: "Keep intrusive checks opt-in",
        body: "The one family that sends extra requests, looking for files like an exposed .env, is switched off by default and prints an authorization warning when enabled.",
      },
    ],
    practical: [
      "A developer runs it against their own staging site before launch and fixes the missing headers in a single configuration change.",
      "An IT team schedules it against their public sites so a certificate never expires unnoticed again.",
      "A security reviewer uses the JSON output to track whether findings from the last assessment were actually fixed.",
    ],
    safety:
      "It performs no injection testing, sends no attack payloads, and does not attempt to exploit anything. The README previously advertised XSS and SQL injection detection that the code never performed; those claims were removed rather than faked. Only inspect sites you own or are explicitly authorized to test.",
    verified: [
      "python3 -m unittest discover -s tests → 30 tests, all passing, fully offline",
      "python3 web_scanner.py --demo → 12 findings across headers, cookies, and TLS",
      "--checks filtering, --output JSON, and unknown-check errors all verified",
    ],
    stack: ["Python 3", "TLS inspection", "HTTP headers", "JSON export"],
  },
  passaudit: {
    slug: "passaudit",
    name: "PassAudit",
    eyebrow: "Identity security",
    intro:
      "Audit password hygiene against current NIST-informed guidance without transmitting a password, installing a dependency, or trusting a black-box score.",
    repo: "https://github.com/Ibby111GT/passaudit",
    language: "Python 3 (standard library only)",
    plain: [
      "Old password meters taught people to turn a predictable word into Password1! and called the result strong. Modern guidance puts the emphasis in a different place: use enough characters, reject known compromised values, screen obvious patterns and context, and use multi-factor authentication.",
      "PassAudit turns that guidance into an offline, inspectable tool. It masks every value it reports, refuses an inline password unless the user explicitly acknowledges the shell-history risk, and keeps all analysis on the local machine. The included demo uses only synthetic examples.",
    ],
    problem:
      "People need useful password feedback, but most meters reward cosmetic complexity, expose secrets in command history, or send the value to an opaque web service.",
    quickstart: [
      {
        command: "git clone https://github.com/Ibby111GT/passaudit && cd passaudit",
        comment: "No install or account required",
      },
      {
        command: "python3 -m passaudit --demo",
        comment: "Run eight bundled synthetic examples without entering a password",
      },
      {
        command: "python3 -m passaudit",
        comment: "Audit a throwaway value through a hidden prompt",
      },
      {
        command: "python3 -m passaudit --file passwords.txt --json report.json",
        comment: "Audit an authorized local list and export masked results",
      },
    ],
    sampleLabel: "Real output — python3 -m passaudit --demo",
    sample: `PassAudit demo -- synthetic examples
Mode: single-factor (floor 15)
==============================================================
p*******(8)                      VERY WEAK      3/100  FAIL
P********(9)                     VERY WEAK     10/100  FAIL
q********(9)                     VERY WEAK      0/100  FAIL
a*******(8)                      VERY WEAK      0/100  FAIL
h******(7)                       VERY WEAK      0/100  FAIL
T**********(11)                  MODERATE      43/100  FAIL
c***************************(28) VERY STRONG  100/100  PASS
g***************(16)             VERY STRONG   88/100  PASS`,
    reading: [
      {
        label: "p*******(8)",
        body: "The value is always masked: one character, asterisks, and its length. Plaintext never appears in the terminal output or JSON report.",
      },
      {
        label: "Single-factor floor 15",
        body: "A password used by itself must be at least 15 characters. Passing --mfa models a password protected by another factor and changes the floor to 8.",
      },
      {
        label: "Blocklist",
        body: "A local list catches common passwords and predictable leetspeak decorations such as swapping a for @ or adding a year and exclamation mark.",
      },
      {
        label: "Entropy upper bound",
        body: "The estimate assumes random character selection, so the tool labels it honestly as a best case. Pattern and blocklist checks can override a high-looking entropy number.",
      },
      {
        label: "PASS / FAIL",
        body: "FAIL means the value is too short or known-compromised. PASS means these checks found no issue; it is useful evidence, not a guarantee or compliance certification.",
      },
    ],
    howItWorks: [
      {
        title: "Accept secrets safely",
        body: "The default single-password flow uses a hidden prompt. Inline values are rejected unless --insecure-inline is supplied, because command arguments leak into shell history and process listings.",
      },
      {
        title: "Normalize and screen locally",
        body: "A bundled wordlist, leetspeak normalizer, keyboard-walk detector, repeated-character test, sequence detector, and optional context terms catch structures attackers try first.",
      },
      {
        title: "Apply the right length floor",
        body: "The core records whether MFA is assumed and applies the corresponding NIST-informed floor without imposing arbitrary uppercase, digit, or symbol composition rules.",
      },
      {
        title: "Explain the result",
        body: "The score is paired with a verdict, concrete issues, next actions, and illustrative crack-time bands. Character-class mix is informational and never changes the verdict.",
      },
      {
        title: "Keep one canonical engine",
        body: "Scoring lives in passaudit/core.py. The package CLI and legacy top-level scripts all call the same implementation, preventing the duplicated logic that caused the original import crash.",
      },
    ],
    practical: [
      "An identity team checks an approved sample of credential-policy data without uploading anything to a third party.",
      "A developer validates that a registration flow follows length and blocklist guidance instead of obsolete composition rules.",
      "A learner compares short complex-looking values with long passphrases and sees why length and MFA change the risk model.",
    ],
    safety:
      "PassAudit makes no network calls. Use synthetic or explicitly authorized values only; never paste a real production password into an unreviewed tool. Hash auditing is local and must only be used on data you own or are authorized to assess.",
    verified: [
      "python3 -m unittest discover -v → 58 tests, all passing",
      "python3 -m passaudit --demo → eight masked synthetic results",
      "Package CLI, JSON masking, compatibility wrappers, and offline hash audit covered by tests",
    ],
    stack: ["Python 3", "NIST SP 800-63B-4", "Offline analysis", "58 tests"],
  },
  logsentry: {
    slug: "logsentry",
    name: "LogSentry",
    eyebrow: "Log analysis",
    intro:
      "Read through server log files, flag the dozen patterns that suggest someone is trying to break in, and score the overall risk.",
    repo: "https://github.com/Ibby111GT/logsentry",
    language: "Python 3 (standard library only)",
    plain: [
      "Every server keeps a diary. It writes a line of text each time somebody logs in, fails to log in, loads a page, or runs a command with administrator rights. A busy machine produces millions of these lines, and almost nobody reads them — which is exactly where attackers prefer to operate.",
      "LogSentry reads that diary for you. It knows twelve patterns that signal trouble: somebody guessing passwords over and over, a login that finally succeeds right after all that guessing, the audit log being switched off at two in the morning, a visitor asking the website for the password file. It ranks what it finds by seriousness and ends with a single score so you can tell a quiet day from a break-in.",
    ],
    problem:
      "The evidence of an intrusion is almost always sitting in the logs before anyone notices, but nobody has time to read millions of lines of routine noise looking for the twenty that matter.",
    quickstart: [
      {
        command: "git clone https://github.com/Ibby111GT/logsentry && cd logsentry",
        comment: "No install step — pure standard library",
      },
      {
        command: "python3 log_analyzer.py --demo",
        comment: "Analyze the bundled sample logs, which tell one full break-in story",
      },
      {
        command: "python3 log_analyzer.py --file samples/auth.log --severity HIGH",
        comment: "Analyze your own log and show only the serious findings",
      },
      {
        command: "python3 log_analyzer.py --demo --json report.json",
        comment: "Export findings for a ticketing system or SIEM",
      },
    ],
    sampleLabel: "Real output — python3 log_analyzer.py --demo",
    sample: `====================================================
  LogSentry -- Security Log Analysis Report
  Log lines : 79
  Risk      : 100/100  CRITICAL
====================================================

  [CRITICAL]  LS004  Audit logging stopped or cleared
      2 event(s) show audit logging being stopped
      Matched 2 log event(s)   MITRE T1562.001
      Why it matters: Turning off or wiping the audit
      log is how an intruder hides their tracks.
      Jul 12 02:15:22 web01 auditd[812]: The audit
      daemon is exiting.

  [CRITICAL]  LS002  Successful login after failures
      Login succeeded after >=3 failures from the
      same IP: admin@203.0.113.45
      Matched 1 log event(s)   MITRE T1110`,
    reading: [
      {
        label: "Risk 100/100 CRITICAL",
        body: "One number summarizing everything found, weighted by how serious each finding is and how many times it occurred. The bundled sample is a complete compromise, so it deliberately maxes out the scale.",
      },
      {
        label: "LS004 / LS002",
        body: "The rule that fired. Each has a stable identifier so a finding can be referenced in a ticket or suppressed later without ambiguity.",
      },
      {
        label: "MITRE T1562.001",
        body: "A reference into MITRE ATT&CK, the shared industry catalogue of attacker techniques. T1562.001 is specifically 'impair defenses by disabling logging'.",
      },
      {
        label: "Why it matters",
        body: "Every rule explains its own reasoning in one sentence, so the output is readable by someone who is not a security specialist.",
      },
      {
        label: "The raw log lines",
        body: "The actual evidence that triggered the finding, so you can verify the tool rather than take its word for it.",
      },
    ],
    howItWorks: [
      {
        title: "Parse several log formats",
        body: "It handles SSH and system logs, Apache and Nginx web access logs, and JSON-per-line formats, turning each into a common event structure. Malformed lines are skipped rather than crashing the run.",
      },
      {
        title: "Run twelve detection rules",
        body: "Each rule looks for one specific behavior and carries an id, a severity, a plain-English explanation, and a MITRE technique reference. They cover password guessing, privilege escalation, log tampering, account creation, off-hours access, one account appearing from two addresses at once, path traversal, SQL injection attempts, scanner-style 404 bursts, and unusually large outbound transfers.",
      },
      {
        title: "Group evidence per finding",
        body: "Nineteen failed logins from one address become a single finding with a count and sample lines, rather than nineteen separate alerts.",
      },
      {
        title: "Score the overall risk",
        body: "Findings are weighted by severity and volume into one 0-100 score with a documented formula. The point is triage between machines, not false precision.",
      },
      {
        title: "Filter and export",
        body: "A severity threshold hides the noise, and JSON export carries the full structured result into a ticketing system or SIEM.",
      },
    ],
    practical: [
      "A small team with no security operations center runs it nightly against their server logs and reads a one-page summary instead of raw files.",
      "During an incident, an investigator points it at the logs from a suspect machine and gets the timeline of what happened, with the evidence attached.",
      "A student learning detection engineering can read twelve real, documented rules and see exactly which log lines trigger each one.",
    ],
    safety:
      "It only reads files you point it at, makes no network connections, and ships its own synthetic sample logs so the demo never touches real system data. The sample data is invented and contains no real personal information.",
    verified: [
      "python3 -m unittest discover → 54 tests, all passing",
      "python3 log_analyzer.py --demo → all 12 rules fire on the sample logs",
      "--severity filtering and --json export verified by reading the report back",
    ],
    stack: ["Python 3", "Detection rules", "MITRE ATT&CK", "JSON export"],
  },
  peptides: {
    slug: "peptides",
    name: "Peptide Evidence Explorer",
    eyebrow: "Healthcare data operations",
    intro:
      "Turn scattered synthetic research records into one searchable, quality-checked registry with provenance, comparison, and export.",
    repo: "https://github.com/Ibby111GT/Peptides",
    liveHref: "/projects/peptides/demo",
    liveLabel: "Open the live explorer",
    language: "HTML, CSS, JavaScript + Python tests",
    plain: [
      "Research teams rarely receive clean, consistent information. One group sends a spreadsheet, another sends an API export, and a third attaches documents. Before anybody compares the records, a data team has to make sure the IDs match, required fields are present, and every number can be traced back to its source.",
      "Peptide Evidence Explorer demonstrates that workflow with fictional healthcare research data. It puts every record into one shared shape, calculates data completeness, flags anything that cannot be traced, and gives a reviewer a focused interface for searching, comparing, and exporting the governed result.",
    ],
    problem:
      "Healthcare research records arrive from disconnected systems, and a polished dashboard is unsafe if nobody can tell which source produced a value or whether required fields are missing.",
    quickstart: [
      {
        command: "git clone https://github.com/Ibby111GT/Peptides && cd Peptides",
        comment: "The application has no package install or third-party dependencies",
      },
      {
        command: "python3 -m http.server 8080",
        comment: "Serve the local files through Python's built-in web server",
      },
      {
        command: "open http://localhost:8080",
        comment: "Or paste this address into your browser",
      },
      {
        command: "python3 -m unittest discover -s tests -v",
        comment: "Validate the schema, disclosures, lineage, controls, and local assets",
      },
    ],
    sampleLabel: "Example registry view",
    sample: `8 synthetic records
3 active studies
93% average completeness
88% source coverage

PXR-104  Northstar-104  Active     Validated  100%
PXR-307  Meridian-307   Paused     Review      92%
PXR-526  Harbor-526     Completed  Validated  100%

Active filters are applied to metrics and exports.`,
    reading: [
      {
        label: "Study status",
        body: "Where the fictional work is operationally: active, completed, or paused. It says nothing about whether a treatment works.",
      },
      {
        label: "Data quality",
        body: "Whether the record has every required field and a traceable source identifier. A paused record can still have valid data, and an active one can still need review.",
      },
      {
        label: "Completeness",
        body: "The percentage of required fields populated. It measures data hygiene, not scientific success or medical effectiveness.",
      },
      {
        label: "Source coverage",
        body: "The share of visible records that can be traced to an upstream source. Provenance lets a reviewer answer 'where did this value come from?'",
      },
      {
        label: "Lineage",
        body: "A short history of how a record moved from its source through validation and normalization into the registry.",
      },
    ],
    howItWorks: [
      {
        title: "Ingest a normalized registry",
        body: "The demo loads a local JSON file containing eight explicitly fictional records. In production, approved APIs, files, or database extracts would replace this source.",
      },
      {
        title: "Validate required fields",
        body: "Each record is checked for stable identity, dates, ownership, source information, and other fields needed by the interface and exports.",
      },
      {
        title: "Separate workflow from quality",
        body: "Study status and data quality are independent. This prevents a reviewer from mistaking 'completed' for 'trustworthy' or 'paused' for 'bad data'.",
      },
      {
        title: "Serve a review workflow",
        body: "Filters recalculate the metrics, record details expose evidence and lineage, and comparison puts like-for-like fields beside each other.",
      },
      {
        title: "Export exactly what is visible",
        body: "JSON retains nested evidence for another application; CSV flattens the current filtered view for a spreadsheet or BI tool.",
      },
    ],
    practical: [
      "A research coordinator spots incomplete records before a reporting deadline and routes them back to the source owner.",
      "A data steward traces a disputed value through its lineage instead of searching through email attachments.",
      "An analyst exports an approved subset for a dashboard without receiving unrestricted access to the raw operational system.",
    ],
    safety:
      "Every program, result, organization, and identifier is fictional. The application is a data-engineering demonstration, not a drug database, treatment guide, or medical decision tool. It makes no external requests after loading.",
    verified: [
      "python3 -m unittest discover -s tests -v → 11 tests, all passing",
      "Search, status filter, quality filter, comparison, detail lineage, and export run in-browser",
      "Synthetic-data disclosure and dependency-free local assets enforced by tests",
    ],
    stack: [
      "Vanilla JavaScript",
      "Responsive CSS",
      "Data provenance",
      "JSON / CSV export",
    ],
  },
};

export const TOOL_SLUGS = Object.keys(TOOL_DOCS);
