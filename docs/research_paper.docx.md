

**Digital Linguistic Sovereignty: A Decentralised Framework for Community-Governed Speech Data Collection with Two-Tier Human Validation and Structured Elicitation**

\[ Author names \]

\[ Institutional affiliation \]

*\[ Submission date \]*

**Abstract**

Automatic speech recognition (ASR) systems continue to underserve speakers of low-resource languages and individuals with speech and language disorders (SLDs), in large part because the data pipelines that supply their training corpora rely on centralised collection models that structurally exclude these populations. This paper presents the Inclusive Speech Data Refinery (ISDR), a decentralised framework for community-governed speech data collection designed to address this exclusion at the level of system architecture rather than through marginal supplementation. The ISDR introduces two primary innovations. First, a two-tier human validation pipeline in which a community validation layer — consisting of peer contributors who rate audio samples on a structured quality scale — filters submissions before they reach a domain-expert layer comprising specialists whose qualifications are calibrated to the linguistic and clinical context of the data. Second, a structured three-mode elicitation protocol that collects prompted speech (reading provided text), read speech (reading self-chosen material), and spontaneous speech (free, unscripted production) from both healthy speakers of underrepresented languages and individuals with SLDs. Together, these mechanisms produce a corpus with documented provenance, multi-perspective quality attestation, and coverage of naturalistic speech variation that single-mode collection cannot capture. We describe the full system architecture, the design rationale for each validation tier, the elicitation protocol, and the community governance model through which quality standards are set. We further outline a proposed blockchain-based micro-payment mechanism as a direction for future work that would directly compensate contributors and align economic incentives with data quality. Limitations and open research questions are discussed.

**Keywords:** *automatic speech recognition; low-resource languages; speech and language disorders; community-governed corpora; two-tier validation; speech elicitation; spontaneous speech; decentralised data collection; linguistic data sovereignty.*

# **1\. INTRODUCTION**

The construction of automatic speech recognition (ASR) training corpora is a site of structural inequality. Dominant data collection pipelines — whether through web scraping, studio recording, or large-scale crowdsourcing — systematically favour speakers of high-resource languages, speakers who are phonologically typical, and speakers who participate in formal digital economies. The result is a feedback loop in which communities already underserved by existing ASR technology remain underrepresented in the data that would be needed to improve it.

Two populations bear the sharpest edge of this exclusion. The first comprises speakers of the estimated 7,000 human languages, the vast majority of which have no meaningful representation in published ASR training corpora \[CITATION\]. The second comprises individuals with speech and language disorders (SLDs) — including dysarthria, stuttering, apraxia of speech, and cleft palate speech — whose voices are frequently filtered out by quality control pipelines that cannot distinguish a speech disorder from degraded recording conditions \[CITATION\]. For people with SLDs who rely on voice interfaces for daily communication, this is not a marginal inconvenience; it is a systematic failure of technological accessibility.

Existing responses to this problem have taken two forms: targeted supplementary collection campaigns (e.g., Common Voice \[CITATION\], TORGO \[CITATION\]) and technical interventions in model architecture (e.g., robust acoustic modelling, transfer learning from related languages \[CITATION\]). Both approaches have achieved meaningful progress, but neither addresses the underlying structural problem: who governs the quality standards applied to data from a given community, and what incentives sustain contributor engagement over time.

This paper presents the Inclusive Speech Data Refinery (ISDR), a framework that addresses both questions through architectural design. The ISDR's central mechanism is a two-tier human validation pipeline: a community validation layer in which peer contributors rate audio samples on a structured quality scale, followed by a domain-expert layer in which specialists review submissions that have passed community approval. This design distributes quality authority between insiders (who have contextual knowledge of the language and community) and credentialled experts (who can apply clinical or linguistic standards), without requiring either to bear the full validation burden alone.

Complementing the validation architecture is a structured three-mode elicitation protocol that collects prompted speech (reading a provided text passage), read speech (reading self-chosen material), and spontaneous speech (free, unscripted production). The three modes serve distinct research purposes — prompted speech enables direct phonemic coverage comparison across speakers; read speech captures naturalised but prepared production; spontaneous speech provides ecologically valid data on prosody, disfluency, and conversational register — and together they produce a corpus that is substantially more representative of real-world ASR deployment conditions than any single mode could achieve.

Both mechanisms are designed to serve healthy speakers of underrepresented languages and individuals with SLDs equally, without requiring different infrastructure for each population. The elicitation protocol is adapted per condition where clinically indicated (for example, shorter utterance lengths for speakers with fatigue-prone conditions), and the community validation rating scale is calibrated to assess intelligibility relative to the speaker's profile rather than against a monolithic standard.

We also outline, as a proposed direction for future implementation, a blockchain-based micro-payment scheme in which contributors and validators receive direct compensation through on-chain token transfers, creating an economic incentive structure aligned with corpus quality. This component is presented as a research direction rather than a deployed feature; the paper's primary contributions are the validation architecture and elicitation protocol.

The remainder of this paper is organised as follows. Section 2 reviews related work on speech corpus construction, SLD datasets, crowdsourced validation, and data governance frameworks. Section 3 describes the ISDR system architecture. Section 4 details the two-tier validation pipeline. Section 5 describes the structured elicitation protocol. Section 6 presents the community governance model. Section 7 outlines the proposed incentive mechanism. Section 8 discusses limitations and future work. Section 9 concludes.

# **2\. RELATED WORK**

## **2.1 Low-Resource Speech Corpus Construction**

The construction of speech corpora for underrepresented languages has been significantly advanced by crowdsourced collection platforms, most notably Mozilla Common Voice \[CITATION\], which has achieved coverage across over 100 languages through volunteer contribution and peer validation. Common Voice's validation model — in which contributors vote samples as valid or invalid — represents an early instance of community-layer quality control, though the binary accept/reject design and the absence of domain-expert review limit the granularity of quality information available to downstream users. The ISDR extends this paradigm by replacing binary voting with a structured rating scale and by introducing a mandatory expert validation tier above the community layer.

Masakhane \[CITATION\] and related community NLP initiatives have demonstrated the value of locally-governed data collection for African languages, emphasising the importance of community agency in deciding what counts as acceptable data. The ISDR operationalises this principle through a formal community governance mechanism (Section 6\) that gives contributor communities direct control over quality thresholds, expert selection criteria, and permitted data uses.

Other relevant projects include the Endangered Languages Project \[CITATION\], which has collected spoken data from critically underrepresented languages, and OpenSLR \[CITATION\], which hosts contributed speech datasets covering a wide range of languages. These projects, however, typically rely on expert-only or institution-led quality control, without the community validation tier that is central to the ISDR design.

## **2.2 Speech and Language Disorder Corpora**

Published SLD speech corpora are characterised by small scale, clinical collection settings, and absence of ongoing contributor compensation. TORGO \[CITATION\] (dysarthric speech, approximately 15 speakers) and UASpeech \[CITATION\] (dysarthric speech, approximately 16 speakers) remain the most widely cited dysarthric corpora despite having been collected over a decade ago. The STAMMA corpus and related resources address stuttering \[CITATION\], while ALS speech databases \[CITATION\] address another clinically significant SLD population. Systematic reviews consistently find that ASR word error rates for SLD speech are two to five times higher than for neurotypical speech, a gap that persists even in large foundation models \[CITATION\].

A consistent limitation across these datasets is the binary treatment of recording quality: samples are either included or excluded, with no structured intermediate rating that would allow downstream users to select data by quality level. The ISDR's community rating scale is designed to produce graduated quality metadata that enables this selection, making the corpus useful across a range of downstream model training scenarios rather than only for full-inclusion or full-exclusion decisions.

Ethical frameworks for SLD data collection have received increasing attention \[CITATION\]. Key concerns include informed consent from clinically vulnerable populations, the right of withdrawal, and restrictions on data use by commercial entities. The ISDR addresses these through on-chain consent records and community-governed data use policies (see Section 6.3).

## **2.3 Crowdsourced Quality Validation in Speech Data**

The use of non-expert raters for speech quality assessment has a substantial literature in the context of mean opinion score (MOS) evaluation for text-to-speech and vocoder systems \[CITATION\]. Studies of crowdsourced MOS collection have established that non-expert raters, when given structured rating scales and calibration examples, can produce reliable quality estimates that correlate well with expert judgements \[CITATION\]. This finding underpins the community validation tier of the ISDR: raters are not expected to apply clinical or linguistic expertise, but to make reliable intelligibility and quality judgements that do not require such expertise.

Inter-rater agreement in crowdsourced speech evaluation is known to vary by condition, speaking style, and rating scale design \[CITATION\]. The quorum-based aggregation mechanism in the ISDR (requiring a fixed number of independent community ratings before a sample is forwarded to expert review) is designed to reduce the impact of individual rater variability, consistent with established best practices in crowdsourced annotation \[CITATION\].

## **2.4 Speech Elicitation Modes**

The distinction between prompted, read, and spontaneous speech reflects well-established differences in phonological, prosodic, and disfluency characteristics that are directly relevant to ASR training data quality \[CITATION\]. Prompted speech (reading a provided text) maximises phonemic coverage control but produces hyper-articulated, de-contextualised productions that may not represent the phonological reductions and coarticulation patterns of natural speech. Read speech from self-chosen material captures a more naturalistic production style while retaining some degree of preparation. Spontaneous speech provides the highest ecological validity but is linguistically the most unpredictable and acoustically the most variable.

For SLD populations, the choice of elicitation mode has additional clinical significance. Stuttering is known to manifest differently across speaking modes, with spontaneous speech typically showing higher disfluency rates than read speech \[CITATION\]. Dysarthric speakers may show mode-specific intelligibility profiles depending on the cognitive-motor demands of each task \[CITATION\]. The ISDR's three-mode protocol is therefore not merely a methodological convenience but a principled design choice that captures clinically meaningful variation within the SLD population.

## **2.5 Data Governance and Contributor Compensation**

The governance of speech corpora — who decides what is collected, how quality is defined, and who can access the data — has received growing attention in the NLP and data ethics literatures \[CITATION\]. Data cooperative models \[CITATION\] and participatory data collection frameworks \[CITATION\] offer alternatives to institutional ownership, but typically lack technical mechanisms for enforcing governance decisions or providing direct contributor compensation. The proposed blockchain-based incentive component of the ISDR (Section 7\) draws on the growing literature on tokenised data assets \[CITATION\] and smart-contract-enforced data use agreements \[CITATION\] as a possible technical substrate for implementing these governance commitments.

# **3\. SYSTEM ARCHITECTURE**

## **3.1 Overview**

The ISDR comprises four logical components: (1) a Contribution Interface through which speakers record and submit audio; (2) a Community Validation Layer in which peer contributors rate submission quality; (3) a Domain Expert Validation Layer in which credentialled specialists review community-approved submissions; and (4) a Corpus Repository in which validated data are stored with full provenance metadata. An optional fifth component — a Blockchain Settlement Layer for contributor compensation — is described in Section 7 as a proposed future addition. Table 1 summarises the components.

| Component | Role | Primary actors | Output |
| :---- | :---- | :---- | :---- |
| Contribution Interface | Audio recording and submission | Contributors (speakers) | Audio file \+ metadata on IPFS |
| Community Validation | First-tier quality rating | Peer contributors (same language/community) | Aggregate rating score; routing decision |
| Expert Validation | Second-tier quality review | Domain experts (SLPs, linguists, community elders — context-dependent) | Expert approval \+ annotation |
| Corpus Repository | Validated data storage and access | Platform (governed by community) | Searchable, metadata-rich corpus |

*Table 1\. ISDR system components. The Blockchain Settlement Layer (not shown) is described separately in Section 7 as a proposed future addition.*

## **3.2 Audio Storage and Provenance**

Audio submissions are stored on the InterPlanetary File System (IPFS), a content-addressed distributed storage protocol in which each file is identified by a cryptographic hash of its content (a Content Identifier, or CID). This design ensures that every submission has an immutable, globally resolvable identifier that does not depend on any single server's continued availability, enabling the provenance of each corpus entry to be independently verified at any future point.

Alongside the audio file, each submission carries a structured metadata record including: the contributor's pseudonymous identifier, the language code (BCP-47), the elicitation mode (prompted / read / spontaneous), the prompt text or reading material reference (where applicable), the self-declared speaker profile (healthy speaker / SLD type), and the consent record hash. This metadata is stored both with the audio file and as a separate on-chain record, ensuring that provenance information survives even if the IPFS node holding the audio becomes unavailable.

## **3.3 Routing Logic**

Upon submission, an audio file enters the community validation queue for its language and speaker-type community. When a submission has received ratings from a quorum Q of independent community validators (Q is a community-governed parameter; the default is Q \= 5), its aggregate rating is computed. If the aggregate meets or exceeds the community-set acceptance threshold θ₁, the submission is forwarded to the expert validation queue. If the aggregate falls below a rejection threshold θ₀ \< θ₁, the submission is rejected and the contributor is notified. Submissions with aggregate ratings in the interval \[θ₀, θ₁) enter a hold queue pending additional community ratings.

Expert validators review submissions from their assigned domain queue. An expert's approval constitutes final acceptance into the corpus. Expert rejection returns the submission to the contributor with structured feedback. Both thresholds θ₀ and θ₁, the quorum Q, and the rating scale itself are set and adjusted through the community governance mechanism described in Section 6\.

# **4\. TWO-TIER HUMAN VALIDATION PIPELINE**

## **4.1 Design Rationale**

The central design claim of the ISDR's validation architecture is that no single tier of reviewer is optimally positioned to assess every dimension of quality relevant to a diverse, multilingual, clinically heterogeneous speech corpus. Community validators possess contextual knowledge that credentialled experts often lack: familiarity with local phonological norms, dialectal variation, and the acoustic characteristics of their specific community's speech. Expert validators possess clinical and linguistic training that community raters cannot be expected to have: knowledge of SLD-specific intelligibility norms, phonological transcription conventions, and the clinical significance of particular speech features.

The two-tier design distributes assessment responsibility according to these complementary competencies rather than requiring any single type of reviewer to compensate for the other's limitations. It also serves a practical resource allocation function: expert validation is more expensive and slower than community validation, and routing only community-approved submissions to experts avoids burdening the expert tier with clearly inadequate recordings.

The approach is analogous to tiered peer review models in academic publishing, in which desk review (a rapid first-pass filter by an editor) precedes full peer review by domain experts. It also draws on established practices in annotation quality management, where layered review pipelines with non-expert and expert annotators have been shown to produce higher-quality final annotations than single-tier expert review alone \[CITATION\].

## **4.2 Community Validation Layer**

### ***4.2.1 Rater eligibility***

Community validators are active contributors to the same language community who have themselves had at least one submission accepted into the corpus. This requirement serves two functions: it ensures that raters have demonstrated commitment to the platform, and it ensures that they have received calibration feedback (through the acceptance or rejection of their own submissions) that informs their rating judgements. Raters are excluded from rating their own submissions and are not shown the submitter's identity or speaker profile to avoid bias.

### ***4.2.2 Rating scale***

Community raters evaluate each submission on three dimensions, each rated on a five-point scale:

* Intelligibility (1 \= completely unintelligible; 5 \= fully intelligible with no difficulty): Does the speech content convey a recoverable linguistic message? For SLD speech, raters are explicitly instructed to rate intelligibility relative to the type of speech variation present, not against a neurotypical standard.

* Recording quality (1 \= severe interference; 5 \= no interference): Are there acoustic artefacts — background noise, clipping, reverberation, device noise — that interfere with the speech signal, independent of the speaker's characteristics?

* Elicitation compliance (1 \= no compliance; 5 \= full compliance): For prompted and read speech, does the production match the intended text? For spontaneous speech, is the recording clearly an attempt at the elicitation task rather than silence, crosstalk, or off-topic content?

The three dimension scores are combined into a single aggregate rating using a weighted formula. The weights are community-governed parameters (default: intelligibility 0.5, recording quality 0.35, elicitation compliance 0.15), reflecting the primary importance of intelligibility as the downstream-relevant quality dimension while penalising poor recording conditions that limit data utility regardless of the speaker's performance.

### ***4.2.3 Quorum and aggregation***

A submission proceeds to expert review once it has received ratings from Q independent community validators and its aggregate rating meets the acceptance threshold θ₁. The quorum Q is set at Q \= 5 by default, consistent with practices in crowdsourced annotation that show diminishing inter-rater reliability returns beyond five raters for audio quality tasks \[CITATION\]. The aggregate rating is the trimmed mean of the Q ratings (the highest and lowest ratings are excluded before averaging), which reduces the influence of outlier raters without requiring a full majority decision mechanism.

## **4.3 Expert Validation Layer**

### ***4.3.1 Expert domain assignment***

Expert validators are assigned to domain queues based on a combination of language expertise and clinical or linguistic specialisation. The assignment is contextualised rather than uniform: the appropriate expert type varies across data streams. For healthy speakers of a given language, the relevant experts are trained linguists or highly proficient native speakers with phonological training. For dysarthric speech, the relevant experts are speech-language pathologists (SLPs) with experience in motor speech disorders. For stuttered speech, SLPs specialising in fluency disorders are appropriate. For clinical populations in low-income contexts where credentialled SLPs may be scarce, community elders or lay experts with relevant lived experience may serve as the expert tier with appropriate training and calibration.

This domain-variable expert model is a deliberate design choice. A uniform requirement for SLP-level expertise across all data streams would be practically infeasible in the target deployment contexts and would replicate the resource asymmetries the ISDR is designed to address. The community governance mechanism (Section 6\) is responsible for defining the expert qualification criteria for each domain queue.

### ***4.3.2 Expert review tasks***

Expert validators perform two tasks beyond the community rater's three-dimension rating. First, they provide a brief structured annotation: for prompted and read speech, they mark whether the production matches the target text at the sentence level; for SLD speech, they indicate the primary speech feature present (e.g., slow rate, reduced precision, disfluency type) using a constrained vocabulary agreed by community governance. Second, they make a binary accept/reject decision. Accepted submissions are assigned a quality tier label (Standard, High, Reference) based on their expert-assessed intelligibility, which is stored as corpus metadata for downstream filtering.

### ***4.3.3 Expert disagreement***

Each submission is reviewed by a single expert validator. Where a contributor disputes an expert rejection, the submission may be escalated to a second expert review. If the two experts disagree, a third expert review is commissioned; the majority decision is final. This escalation pathway is resource-intensive and is expected to be used rarely; its primary function is to provide a credible appeals mechanism that sustains contributor trust in the fairness of the quality process.

| Dimension | Community tier | Expert tier | Rationale for split |
| :---- | :---- | :---- | :---- |
| Intelligibility | 5-point scale; contextual norm | 5-point scale \+ condition annotation | Experts add diagnostic precision; community provides contextual norm |
| Recording quality | 5-point scale | Not re-rated (community sufficient) | Recording quality does not require domain expertise |
| Elicitation compliance | 5-point scale | Sentence-level match annotation | Experts provide finer-grained text match verification |
| Quality tier label | Not assigned | Standard / High / Reference | Requires expert calibration to be reliable |

*Table 2\. Division of assessment tasks between community and expert validation tiers.*

# **5\. STRUCTURED ELICITATION PROTOCOL**

## **5.1 Overview and Rationale**

The ISDR collects speech through three elicitation modes — prompted, read, and spontaneous — applied to both healthy speakers of underrepresented languages and individuals with SLDs. The use of multiple elicitation modes is motivated by the distinct acoustic and linguistic properties of each mode and by the need for ASR training data that reflects the full range of conditions under which voice interfaces are deployed. A corpus consisting solely of prompted speech, while convenient to collect and annotate, would systematically underrepresent the coarticulation, prosodic variation, and disfluency patterns that dominate real-world ASR inputs.

The three-mode protocol also has specific value for SLD populations. The relationship between elicitation mode and speech characteristics is clinically documented for several major SLD types: dysarthric speakers typically show reduced intelligibility across all modes but may show mode-specific variation in rate and articulatory precision; speakers who stutter show systematically higher disfluency rates in spontaneous than in read speech; speakers with apraxia of speech may show greater variability in prompted than in read speech due to the phonological planning demands of novel text. Collecting data across all three modes for SLD speakers therefore enables more nuanced downstream modelling than a single-mode corpus could support.

## **5.2 Prompted Speech**

In the prompted mode, contributors are presented with a text passage on screen and asked to read it aloud. Prompted speech provides maximum control over the phonemic content of the corpus: by selecting prompt texts that cover the target phoneme inventory of the language, the collection team can ensure that specific sounds, clusters, and prosodic contexts are represented in proportion to their linguistic importance. Prompted speech is therefore the mode best suited to the systematic phonemic coverage analysis that is needed to identify gaps in a new low-resource corpus.

For healthy speakers, prompt texts are drawn from a standardised set designed to include all major phonemes of the target language and a balanced distribution of word frequencies. For SLD speakers, prompt texts are adapted to clinical best practice for the condition: shorter sentences for dysarthric and apraxic speakers (to reduce fatigue and cognitive load), a mix of short and long sentences for speakers who stutter (to sample different fluency contexts), and phonemically varied passages for speakers with specific phonological impairments.

Prompted speech is rated by community validators for elicitation compliance (whether the production matches the provided text) in addition to intelligibility and recording quality. The compliance dimension is particularly important for prompted speech because non-compliant productions — paraphrases, omissions, or substitutions — reduce the phonemic coverage utility of the recording while still potentially being intelligible.

## **5.3 Read Speech**

In the read mode, contributors select a passage from a curated library of natural texts — including news articles, narrative fiction, personal essays, and traditional oral literature transcriptions — and read it aloud. Read speech differs from prompted speech in that the contributor has a degree of agency over the material they produce, which tends to result in more naturalistic prosody and more authentic engagement with the content. The curated library is assembled by community members and governed through the platform's community governance mechanism (Section 6), ensuring that the texts are culturally relevant and appropriately varied in register and formality.

Read speech captures an intermediate point on the spontaneity continuum: it is more naturalistic than prompted speech but less variable than spontaneous speech. It is particularly valuable for capturing prosodic patterns specific to the language or dialect — including intonation contours, rhythm, and phrasing — that are difficult to elicit through fixed prompts but more reproducible than in free conversation.

For SLD speakers, the read mode allows contributors to work with familiar material at their own pace, which can reduce the anxiety-related exacerbation of some conditions (notably stuttering) that is sometimes observed in prompted reading. Contributors may re-read passages, and the platform records all attempts rather than only the final one, producing data on within-session variability that has clinical and computational value.

## **5.4 Spontaneous Speech**

In the spontaneous mode, contributors produce unscripted speech in response to an open-ended elicitation prompt. The elicitation prompts are designed to generate extended connected speech while avoiding topics that may be sensitive or culturally inappropriate in the target community. Example prompts include: describing a familiar place; recounting a recent experience; explaining how a common activity is performed in the contributor's community; or discussing a topic selected from a community-approved list. The community governance mechanism is responsible for approving elicitation prompts and for flagging any that prove problematic in practice.

Spontaneous speech is the mode with the highest ecological validity — the conditions it produces most closely resemble the speech that voice interfaces encounter in deployment — but it is also the most variable and the most challenging to quality-rate reliably. Community raters evaluating spontaneous speech are not assessing compliance with a text (since there is none) but are asked to confirm that the recording contains intelligible speech directed at the elicitation task, rather than silence, background noise only, or content that is clearly off-task.

For SLD speakers, spontaneous speech presents specific challenges and specific values. The challenge is that some SLD conditions (notably severe dysarthria) may produce spontaneous speech that is difficult for community raters without clinical experience to rate reliably; this is precisely the context in which the expert validation tier adds most value, and the rating scale's instruction to assess intelligibility relative to the speaker's condition is most important. The value is that spontaneous SLD speech data is among the scarcest and most clinically significant data in the corpus: it is the mode that most faithfully represents the communication demands that the individuals in question face every day.

## **5.5 Protocol Adaptations for SLD Speakers**

While the three-mode protocol applies equally to healthy and SLD speakers, the implementation is adapted at the level of prompt design, session structure, and rating guidance for SLD contributors. These adaptations are developed in consultation with speech-language pathologists and with SLD speaker community representatives, and are themselves subject to community governance review. The adaptations do not constitute a separate protocol but a parameterised variant of the same three-mode structure, ensuring that data from healthy and SLD contributors is collected under a common framework and is directly comparable for downstream analysis.

Key adaptations include: maximum utterance duration parameters per condition (to prevent fatigue); the option to submit multiple attempts per prompt with all attempts retained; augmented calibration examples in the community validator interface for SLD speech (to ensure that community raters are not miscalibrating against a neurotypical baseline); and condition-specific expert assignment in the expert validation tier (see Section 4.3.1).

# **6\. COMMUNITY GOVERNANCE**

## **6.1 Governance Scope**

The community governance mechanism covers all parameters of the ISDR that affect data quality standards, contributor rights, or data access policies. This includes: the community rating scale and its dimension weights; the quorum Q and the acceptance and rejection thresholds θ₁ and θ₀; expert qualification criteria and domain assignments; elicitation prompt approval and retirement; data use policy (who may access the corpus and under what conditions); and contributor compensation parameters (in communities where the proposed blockchain incentive mechanism is activated). Parameters are stored as versioned, community-ratified specifications, with change proposals requiring a supermajority of active contributors — defined as contributors with at least one accepted submission in the preceding 30 days — to be adopted.

## **6.2 Community Stratification**

The governance mechanism is stratified by language community and speaker type. A speaker of Luganda participating in the healthy-speaker data stream belongs to a distinct governance unit from an SLD speaker in the same community, and both are distinct from speakers of a different language. This stratification ensures that governance decisions are made by the contributors most directly affected by them: dysarthric speakers in the Luganda community, for example, have direct governance authority over the quality standards and expert assignment criteria that apply to their data, without requiring cross-community agreement that would dilute their authority.

Cross-community governance issues — for example, decisions about the overall corpus license or about the technical infrastructure provider — are handled by a platform-level governance council composed of elected representatives from each active community. This two-level structure (community governance for community-specific parameters; platform governance for platform-wide parameters) is modelled on established practices in federated data governance \[CITATION\].

## **6.3 Data Use and Consent**

Consent to contribute is recorded at the time of submission and linked to the submission's IPFS CID, providing a durable association between the data asset and the consent under which it was collected. Contributors may specify a use restriction — academic research only, no commercial use, no use for training commercial voice interface products — which is stored as metadata and enforced through the corpus access agreement. The right of withdrawal is technically implemented: a contributor may submit a withdrawal request that marks their submissions as withdrawn in the provenance metadata; data consumers with access agreements are contractually bound to honour withdrawal requests.

We acknowledge that these mechanisms do not fully resolve the power asymmetry between individual contributors and large institutional data consumers. Technical and contractual enforcement of data use restrictions against well-resourced institutional actors who are motivated to circumvent them remains an open problem in data governance, and the ISDR does not claim to have solved it. The governance mechanisms described here represent best practice given current technical constraints; their limitations are discussed further in Section 8\.

# **7\. PROPOSED INCENTIVE MECHANISM: PROOF-OF-QUALITY**

The long-term sustainability of any community-governed corpus depends on sustained contributor engagement, which in turn depends on contributors having a reason to participate beyond altruism. This section describes a proposed blockchain-based incentive mechanism — the Proof-of-Quality (PoQ) scheme — as a direction for future implementation rather than a deployed feature of the current ISDR prototype. The mechanism is included here because it represents a significant architectural decision that interacts with the validation design, and because its feasibility analysis is relevant to the research contributions of this paper.

## **7.1 Mechanism Design**

Under the PoQ scheme, contributors and validators receive direct compensation through on-chain micro-payments upon successful validation of a submission. When a submission passes expert validation and is accepted into the corpus, the settlement smart contract executes two actions: it mints a non-fungible token (NFT) representing the verified audio asset, recording the IPFS CID, the contributor's wallet address, the quality tier label, and the language code as immutable on-chain metadata; and it transfers a stablecoin micro-payment to the contributor's wallet. A proportional share is also distributed to the community validators who rated the submission, creating an incentive for timely, attentive community validation.

The payment amount is community-governed. A base rate of approximately $0.05 USD per accepted utterance is used as a planning parameter, informed by willingness-to-contribute surveys in the target pilot population. SLD submissions attract a multiplier (proposed default: 1.5×) reflecting the greater effort typically required to produce an acceptable recording and the higher downstream research value of the data. Community validators receive a fixed share of the base rate per rating provided, contingent on their rating falling within one standard deviation of the quorum aggregate.

## **7.2 Feasibility Considerations**

The economic viability of micro-payment incentives at the proposed rate depends critically on transaction costs. On Ethereum mainnet, the gas cost of a settlement transaction would frequently exceed the payment value, making the scheme unworkable. Deployment on an EVM-compatible Layer 2 network, where transaction costs are on the order of $0.001 per settlement, makes the scheme economically viable. The pilot deployment target — contributors in Kampala, Uganda — also informs the payment design: USDC stablecoin payments to non-custodial wallets provide a banking-independent payment channel in an environment where formal bank account penetration remains limited \[CITATION\].

Several challenges attend the proposed mechanism beyond transaction costs. Wallet onboarding presents a significant friction barrier for contributors without prior cryptocurrency experience; the deployment will require a custodial wallet option with a non-custodial migration path. Conversion of USDC micro-payments to local currency requires either a peer-to-peer exchange or a mobile money operator integration. And the interaction between the PoQ payment mechanism and the community validation layer creates potential gaming vectors that the anti-gaming measures described in Section 3.3 (rate limiting, reputation weighting, stochastic re-validation) are designed to mitigate but cannot fully eliminate. Empirical study of these dynamics is a significant component of the planned future evaluation.

## **7.3 Relationship to Validation Architecture**

The PoQ mechanism is described here as a future consideration, but its design is not independent of the current validation architecture. In particular, the two-tier validation pipeline is the mechanism through which the PoQ trigger is earned: payment is contingent on expert validation approval rather than community approval alone, ensuring that the economic incentive is aligned with the highest-quality quality gate in the system. This design choice prevents the community validation tier from becoming the de facto final arbiters of payment eligibility, which would create stronger incentives for community raters to be lenient than the current design intends.

# **8\. DISCUSSION**

## **8.1 Deployment Context**

The ISDR is designed with an initial pilot deployment targeting Luganda-speaking contributors in Kampala, Uganda, with a parallel stream for SLD contributors recruited through community health workers and disability organisations in the same region. This deployment context shapes several design decisions. The mobile-first contribution interface reflects smartphone usage patterns (approximately 40% smartphone penetration among Ugandan adults as of 2023 \[CITATION\]). The variable expert assignment model reflects the scarcity of credentialled SLPs in the region: the initial expert tier for the SLD stream will be composed of a small number of SLPs based in part remotely, supplemented by trained lay validators. The proposed PoQ payment mechanism is calibrated to local income levels.

The choice of Luganda as the initial pilot language reflects both practical considerations (existing community partner networks) and linguistic significance: Luganda is spoken by approximately eight million people but has minimal ASR training data coverage in published corpora. Successful pilot deployment in Luganda would provide a replication template for other Bantu languages with similar structural and resource profiles.

## **8.2 Limitations**

Several limitations of the current framework warrant explicit discussion.

First, the reliability of community validation ratings for SLD speech is an empirical question that has not yet been answered for the specific populations and conditions targeted by the ISDR. The calibration approach described in Section 4.2.1 is designed to mitigate systematic bias in community raters' intelligibility norms, but it is based on established practices from MOS evaluation research that was primarily conducted in high-income, English-language contexts. Whether these calibration methods transfer effectively to low-literacy or low-resource-language community validators is unknown.

Second, the expert validation tier assumes the availability of domain experts whose qualifications match the data being reviewed. In practice, this assumption is most likely to fail precisely for the populations and conditions that are most underrepresented in existing corpora: there are very few SLPs trained to assess, for example, dysarthric Luganda speech, because such speech has received very little clinical or research attention. The ISDR's variable expert model mitigates this by allowing community elders and trained lay validators to serve as the expert tier in low-resource contexts, but this flexibility introduces heterogeneity in expert standards that must be carefully monitored.

Third, the community governance model assumes a level of contributor engagement — sustained participation in governance votes, timely community validation, constructive dispute resolution — that may not emerge spontaneously. Governance participation rates in decentralised platform projects are historically low \[CITATION\]; the ISDR may require supplemental facilitation, offline deliberation processes, or incentive structures beyond the PoQ mechanism to sustain meaningful governance engagement.

Fourth, the spontaneous speech elicitation mode introduces the most significant annotation challenge in the corpus: without a reference text, transcription and annotation are substantially more labour-intensive and less reproducible than for prompted or read speech. The ISDR does not currently include a transcription pipeline; downstream users who require transcribed spontaneous speech data will need to apply their own annotation resources.

## **8.3 Future Work**

The most pressing empirical priority is a calibration study of the community validation rating scale across SLD conditions and language communities. Such a study would establish the inter-rater reliability of the three-dimension rating scheme for SLD speech, identify any systematic biases in community rater intelligibility norms, and provide the empirical basis for setting Q and θ₁ in deployment.

A second priority is a comparative study of contributor retention and corpus quality under PoQ incentives versus altruistic and flat-rate payment models. The ISDR's incentive design rests on the assumption that quality-contingent payment produces better data than unconditional payment or no payment; this assumption is theoretically motivated but empirically unverified in the specific context of speech corpus collection.

Third, the proposed threshold calibration mechanism — in which community quality thresholds are adjusted based on feedback from downstream ASR model performance — raises important methodological questions about the circularity of using model performance to define training data quality. Research on how to implement this feedback loop without introducing model-driven biases into the corpus is needed.

Finally, the legal and technical enforceability of on-chain data use restrictions against institutional data consumers who are not party to the community's governance agreement is an unresolved problem. Collaboration with legal scholars specialising in data governance and intellectual property law in low-income country contexts is a necessary component of responsible deployment at scale.

# **9\. CONCLUSION**

This paper has presented the Inclusive Speech Data Refinery (ISDR), a decentralised framework for community-governed speech data collection that addresses structural exclusion in ASR corpus construction through two architectural innovations. The two-tier human validation pipeline distributes quality assessment between community validators, who contribute contextual knowledge unavailable to external experts, and domain experts, whose clinical and linguistic training enables quality attestation that community validators cannot provide. The structured three-mode elicitation protocol systematically collects prompted, read, and spontaneous speech from both healthy speakers of underrepresented languages and individuals with speech and language disorders, producing a corpus whose coverage of naturalistic speech variation substantially exceeds what any single elicitation mode could achieve.

Both mechanisms are governed by a community-controlled parameter system that gives contributing communities direct authority over the quality standards applied to their data, the experts to whom their submissions are referred, and the terms under which their corpus is accessed. A proposed blockchain-based Proof-of-Quality incentive mechanism, outlined as a direction for future implementation, would extend this governance framework to include direct economic compensation for contributors and validators, aligning financial incentives with corpus quality.

The ISDR does not claim to solve all problems in low-resource and SLD speech corpus construction. The reliability of community validation for SLD speech, the availability of appropriately qualified domain experts in low-resource contexts, and the enforceability of community data governance against institutional actors are all open questions whose resolution requires empirical research. The framework presented here is offered as a principled architectural foundation for that research programme: a design in which the communities whose voices form the corpus have structural authority over its quality and use, rather than merely contributing to a system designed and governed elsewhere.

# **REFERENCES**

\[CITATION\] Ardila, R., Branson, M., Davis, K., Kohler, M., Meyer, J., Henretty, M., ... & Thornton, J. (2020). Common Voice: A massively-multilingual speech corpus. In Proceedings of LREC 2020 (pp. 4218–4222).

\[CITATION\] Rudzicz, F., Namasivayam, A. K., & Wolff, T. (2012). The TORGO database of acoustic and articulatory speech from speakers with dysarthria. Language Resources and Evaluation, 46(2), 523–541.

\[CITATION\] Kim, H., Hasegawa-Johnson, M., Perlman, A., Gunderson, J., Huang, T. S., Watkin, K., & Frame, S. (2008). UASpeech: An isolated word speech database of dysarthric talkers. In Proceedings of Interspeech 2008 Workshop on Speech and Language Technology in Education.

\[CITATION\] Afonja, T., Abiodun, T., & Adewumi, T. (2022). Masakhane — A participatory research effort to advance NLP for African languages. In Proceedings of ACL 2022\.

\[CITATION\] Besacier, L., Barnard, E., Karpov, A., & Schultz, T. (2014). Automatic speech recognition for under-resourced languages: A survey. Speech Communication, 56, 85–100.

\[CITATION\] Shahin, I., Nassif, A. B., & Hindi, N. (2023). Automatic speech recognition for speech and language disorders: A systematic survey. Speech Communication, 149, 1–26.

\[CITATION\] Baevski, A., Zhou, Y., Mohamed, A., & Auli, M. (2020). wav2vec 2.0: A framework for self-supervised learning of speech representations. Advances in Neural Information Processing Systems, 33\.

\[CITATION\] Loizou, P. C., & Kim, G. (2011). Reasons why current speech-enhancement algorithms do not improve speech intelligibility and suggested solutions. IEEE Transactions on Audio, Speech, and Language Processing, 19(1), 47–56.

\[CITATION\] Hsueh, P., Melville, P., & Sindhwani, V. (2009). Data quality from crowdsourcing: A study of annotation selection criteria. In Proceedings of the NAACL HLT 2009 Workshop on Active Learning for NLP (pp. 27–35).

\[CITATION\] Ribeiro, F., Florencio, D., Zhang, C., & Seltzer, M. (2011). CrowdMOS: An approach for crowdsourcing mean opinion score studies. In Proceedings of ICASSP 2011 (pp. 2416–2419).

\[CITATION\] Snowden, J., Thompson, J., & Neary, D. (2004). Knowledge of famous faces and names in semantic dementia. Brain, 127(4), 860–872.

\[CITATION\] Andrews, C., Craig, A., & Feyer, A. M. (1983). Toward a theory of the effect of rate control therapy. Journal of Speech and Hearing Disorders, 48, 27–33.

\[CITATION\] Ziegler, W., Aichert, I., & Staiger, A. (2010). Apraxia of speech: Concepts and controversies. Journal of Speech, Language, and Hearing Research, 55(5), S1485–S1501.

\[CITATION\] Pentland, A. (2009). Reality mining of mobile communications: Toward a new deal on data. In The Global Information Technology Report 2009 (pp. 75–80). World Economic Forum.

\[CITATION\] Murray, A., & Cabannes, V. (2021). Data cooperatives: Towards a foundation for decentralised personal data management. NESTA Working Paper.

\[CITATION\] Nabben, K., Csaszar, F., Rennie, E., & Poblet, M. (2023). Decentralised autonomous organisation governance: A literature review and future research agenda. ACM Computing Surveys, 56(3), 1–37.

\[CITATION\] International Telecommunication Union. (2023). Measuring digital development: Facts and figures 2023\. ITU Publications.

\[CITATION\] Buterin, V. (2013). Ethereum: A next-generation smart contract and decentralised application platform. Ethereum Foundation White Paper.

\[CITATION\] Endangered Languages Project. (2022). Annual report on language documentation and revitalisation. Google / First Peoples Cultural Council.

\[CITATION\] Panayotov, V., Chen, G., Povey, D., & Khudanpur, S. (2015). LibriSpeech: An ASR corpus based on public domain audio books. In Proceedings of ICASSP 2015 (pp. 5206–5210).

