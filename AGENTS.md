# Agent Working Rules

These instructions apply to AI coding agents working in this repository, including Codex, Claude Code, Cursor, and other local agents that read repository guidance files.

## 铁律：根因修复

**做根因修复，用正确的逻辑覆盖错误，而不是打补丁。**

- 发现 bug 或设计错误时，先定位**错误假设或错误模型**（数据流、状态机、契约、边界），再改到源头。
- **禁止**用特殊分支、临时 flag、吞异常、重试掩盖、默认值兜底等方式「让现象消失」而留下错误逻辑。
- 若旧逻辑本身是错的，**删除或重写**它，而不是在外面再包一层 guard。
- 若根因在上游（规范、表结构、接口契约、配置），先与用户确认边界，再改下游；不要为了适配错误上游而在下游堆补丁。
- 唯一可接受的「小改」：根因已修、仅为兼容旧调用方的**薄适配层**——且必须标注 TODO 与移除条件，不得无限期留存。

Patch work the user did not order is rework. Root-cause work is the deliverable.

---

## Before Implementing

Work like a contractor who pays for rework. Catch wrong assumptions early, and do not make the user answer questions the repository already answers.

### 1. Investigate Before Asking

Read the relevant code, tests, configs, dependency manifests, and documentation first. Search the repository and use the available tools before asking anything. If the answer is discoverable in under a minute, investigate it yourself.

Do not ask about the test framework, language version, lint rules, error-handling conventions, directory layout, or existing abstractions when the repository already answers them. If the codebase contradicts itself, or a missing answer would change the design, raise it.

A question you could have answered by searching the repo is rework.

### 2. Produce This, Then Stop

For non-trivial or risky changes, produce the following before editing code:

**Goal**

Restate the task in one paragraph in your own words, including the acceptance criteria. If the restatement is wrong, this is the cheapest place to catch it.

**Blocking Questions (0-3)**

Ask only when a wrong answer would force us to throw work away, not merely adjust it. Include your recommended default with every question so the user can reply "use all defaults." If nothing truly blocks the work, write "none."

**Assumptions**

List at most five assumptions. Every assumption must be load-bearing: if being wrong would not change the design, delete it. List only specific, falsifiable assumptions, covering only the areas this task touches:

- Data: shape, volume, trust level, encoding, and malformed inputs
- Failure: timeout, partial write, downstream error; retry, fail loudly, or degrade
- Boundaries: callers, public vs. internal APIs, and backwards compatibility
- State: concurrency, idempotency, transactions, and ordering guarantees
- Environment: runtime version, deployment target, and allowed external access
- Scope: what you will not do and what remains TODO
- Testing: what you will test and what will remain uncovered

**Plan**

List the files you will create or modify, the key function or type signatures, and the order of work. Where real alternatives exist, name the rejected option and explain why in one clause.

Then stop. Do not implement until the user approves.

### 3. Match The Process To The Risk

For a typo, rename, or an obvious change under about 20 lines with one clear solution, skip the full process and just do it.

For a new module, schema change, auth, money, migrations, or deletion, use the full process.

For everything in between, use this rule: if you cannot say what makes a change safe, treat it as risky.

### 4. After Approval

Implement the plan as approved. If an assumption fails during implementation, or the plan no longer fits the code, stop and tell the user. Do not switch designs without telling the user or continue with an approach you now believe is wrong.

### 5. Prove It Worked

Run the tests promised in Assumptions and paste the relevant output. List every file touched, with one line explaining why for each.

Change only what the plan names. A drive-by refactor is work the user did not order. Code without evidence is a claim, not a deliverable.

### 6. UI Descriptions

Do not add subtitles, helper text, or descriptive copy beneath headings, labels, cards, or settings by default. Prefer one concise, self-explanatory heading or label. Only add supporting copy when the user explicitly asks for it or when it is necessary to prevent misunderstanding or error, and never use it to restate the heading.
