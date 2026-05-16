# Research Documentation: Evidence Base for RehabRoute Interface and Assessment Design

## Document purpose

This documentation synthesizes the provided research and product sources into a design-facing evidence file for a rehabilitation and aftercare platform, referred to here as **RehabRoute**. The focus is not only clinical content, but how the evidence should influence interface design, information architecture, accessibility, and protocol logic.

The evidence corpus combines post-stroke balance and fall-risk literature, force-plate balance assessment literature, force-plate product materials, and gender-affirming surgery (GAS) aftercare literature. Vendor sources such as BTrackS and AMTI are treated as product-positioning evidence, not as independent clinical validation.

---

## Source map

| ID | Source | Source type | Primary relevance to this documentation |
|---|---|---|---|
| [1] | Chen et al., 2021, *Review of the Upright Balance Assessment Based on the Force Plate* | Peer-reviewed review | Force-plate balance assessment concepts, COP variables, standardization needs, and limitations of non-instrumented scales. |
| [2] | Aryan et al., 2023, *Reliability of force plate-based measures of standing balance in the sub-acute stage of post-stroke recovery* | Peer-reviewed reliability study | Reliability of force-plate metrics in sub-acute stroke; implications for which metrics should be surfaced in the UI. |
| [3] | Abdollahi et al., 2022, *A Systematic Review of Fall Risk Factors in Stroke Survivors* | Peer-reviewed systematic review | Shift from subjective fall-risk tools toward objective measures, detailed motion analysis, IMUs, and dual-task protocols. |
| [4] | Khan and Chevidikunnan, 2021, *Prevalence of Balance Impairment and Factors Associated with Balance among Patients with Stroke* | Peer-reviewed cross-sectional study | Stroke balance impairment prevalence, BBS/BI/TUG/GDS context, and relationship between balance and ADL. |
| [5] | BTrackS, *Affordable Force Plate Balance Systems* | Product source | Objective balance assessment, step-by-step onscreen guidance, intuitive interface, protocolized software, and portability claims. |
| [6] | AMTI, *Precision Force Plates and Force Platforms for Biomechanics* | Product source | Lab-grade and portable force-plate ecosystem, precision claims, mounted versus portable platform distinction, USB integration. |
| [7] | de Brouwer et al., 2021, *Aftercare Needs Following Gender-Affirming Surgeries* | Peer-reviewed mixed-methods study | Post-GAS aftercare needs, provision-of-care themes, mental health, pelvic floor therapy, and need for clear recovery instructions. |
| [8] | Bishop et al., 2023, *Pain and Dysfunction Reported After Gender-Affirming Surgery* | Peer-reviewed scoping review | Lack of standardized pain/dysfunction outcomes and role of physical therapy after GAS. |
| [9] | AOTA, 2023, *Working with TGD clients post-gender affirming surgery* | Professional toolkit | OT/PT post-GAS precautions, ADL/IADL implications, and multidisciplinary care framing. |
| [10] | CDC, 2024, *Stroke Facts* | Public health source | Stroke burden and mobility/disability context. |

---

## 1. Major themes

### 1.1 The shift toward objective quantitative interfaces

A central theme across the balance-assessment sources is the movement away from exclusively subjective clinical observation and toward instrumented, quantitative data. Chen et al. describe non-instrumental balance tests as limited by ceiling effects, low sensitivity, and subjective evaluation, and argue that quantitative balance assessment is essential for tracking disease and therapeutic intervention [1]. Their review identifies force plates as a key quantitative method and describes center of pressure (COP) trajectories from high-precision force plates as a gold-standard balance-performance measure [1].

The post-stroke fall-risk review reaches a similar conclusion from a different angle. Abdollahi et al. found that balance- and motion-related measures were among the most common and significant fall-risk factors in stroke survivors, with motion-related measures showing the highest significance ratio among commonly studied factors [3]. The same review explicitly identifies a trend in which subjective tools are being replaced first by simple objective measures, such as walking speed, and then by detailed quantitative motion analysis [3].

For RehabRoute, this supports an interface model that treats clinical scales as useful context but not the whole assessment. A balance module should capture and display instrumented data such as COP speed, COP displacement, weight-bearing asymmetry, and symmetry measures when available. It should also preserve the clinical-scale context, such as BBS, TUG, BI, and ADL-related information, because these measures remain common in stroke rehabilitation and fall-risk workflows [3], [4].

**Design implication:** RehabRoute should provide a hybrid assessment dashboard: validated clinical scales for continuity with existing workflows, and instrumented force-plate or sensor data for higher-resolution clinical decision support.

### 1.2 Onscreen guidance and ease of use

Commercial force-plate systems emphasize that quantitative tools must be usable in clinical environments. BTrackS describes its balance software as including preprogrammed protocols with step-by-step onscreen guidance, testing-history reports, and custom protocol creation [5]. The same product material highlights a user-friendly, intuitive interface and a fall-risk metric with normative data [5].

This matters because highly instrumented systems can fail clinically if they increase setup burden, require too much technical interpretation, or produce reports that clinicians cannot act on quickly. The RehabRoute interface should therefore present protocols as guided workflows rather than as raw data-acquisition screens.

**Design implication:** Force-plate and sensor modules should use protocol wizards, clear step-by-step instructions, safety prompts, progress states, and automated report summaries. Raw data should remain accessible, but the default view should support rapid interpretation by clinicians.

### 1.3 Accessibility through portability

The literature and product sources show tension between lab-grade precision and real-world access. Chen et al. note that 3D motion-capture approaches can provide accuracy and reliability, but require high-precision equipment, space, time, cost, and trained personnel [1]. AMTI distinguishes permanently mounted platforms for labs from portable platforms for gait and balance, including platforms described with clean USB integration [6]. BTrackS similarly highlights lightweight and portable design [5].

Abdollahi et al. argue that wearable IMU sensors are promising because force plates usually limit data collection to laboratory environments, while wearable sensors can better support motion and balance analysis in clinics and beyond [3]. They also discuss the possibility that validated IMU-based models could support smartphone applications, reduce the need for clinical visits, and provide real-time assessment during activities of daily living (ADL) [3].

**Design implication:** RehabRoute should support multiple data-capture tiers: lab force plate, portable force plate, wearable IMU, and smartphone-based assessments. Each data source should be labeled with reliability level, protocol conditions, and validation status so clinicians understand whether the data is clinical-grade, screening-grade, or exploratory.

### 1.4 Patient-centric information architecture for specialized aftercare

The post-GAS sources point toward a different but related interface principle: patients and clinicians need clear, structured, context-specific guidance. de Brouwer et al. found that 65% of participants reported a desire for additional postoperative care after GAS; the most common needs were assistance in surgical recovery, mental health consultation, and pelvic floor physiotherapy [7]. Their thematic analysis identified four aftercare-optimization domains: provision of care, additional mental health care, improvement of organization of care, and surgical technical care [7].

The same study emphasizes that clear information about symptoms, when to seek care, recovery consequences, and recovery do's and don'ts may improve long-term functional and aesthetic outcomes [7]. Bishop et al. add that many studies after GAS do not systematically collect standardized information about pain and dysfunction, even though pain and urogenital dysfunction are clinically relevant and often fall within the scope of physical therapy [8]. AOTA's post-GAS OT toolkit reinforces that surgical restrictions vary by program and surgeon, and that practitioners should confirm restrictions with the acting surgeon [9].

**Design implication:** RehabRoute should not present generic aftercare instructions as if they apply universally. It should organize care instructions by procedure, surgeon/program protocol, recovery phase, symptom type, and visit purpose.

---

## 2. Points of consensus

### 2.1 Rehabilitation platforms need multidisciplinary design

The sources converge on the need for a multidisciplinary platform. Post-stroke fall risk is not only a gait-speed problem; it involves motor function, balance, cognition, vision, depression, ADL, and fear of falling [3], [4]. Post-GAS aftercare similarly spans surgery, wound care, pelvic health, pain, ADL/IADL performance, mental health, and long-term functional outcomes [7], [8], [9].

For RehabRoute, this means the UI cannot be designed for one profession only. Surgeons, physical therapists, occupational therapists, mental health professionals, and primary care clinicians may need different views of the same patient record.

**Requirement:** Provide role-sensitive views while maintaining a shared care plan. For example, the surgeon view may prioritize complication flags and wound status; the PT view may prioritize pelvic floor, gait, balance, pain, and functional limitations; the OT view may prioritize ADL/IADL restrictions and home/work participation; the mental health view may prioritize psychological support needs.

### 2.2 Standardization remains a major gap

Both domains show standardization problems. In balance assessment, Chen et al. identify inconsistencies in equipment selection, trial number, trial duration, foot posture, and assessment variables [1]. Abdollahi et al. identify a gap in standardized selection of fall-risk factors in stroke research [3]. Aryan et al. show that some force-plate measures are more reliable than others in sub-acute stroke, with mean AP-COP speed and directional weight-bearing asymmetry showing high reliability, while some other measures have lower reliability [2].

In GAS aftercare, Bishop et al. report that studies often fail to use standardized pain and dysfunction outcomes and recommend recognized definitions and measures for complications such as pain, dyspareunia, and incontinence [8]. de Brouwer et al. also state that concrete specifications for aftercare plans remain limited, even though patients report strong needs for guidance, psychological support, and pelvic floor physiotherapy [7].

**Requirement:** RehabRoute should separate structured, standardized fields from free-text notes. Structured fields should include validated assessment names, protocol conditions, instrument type, measurement units, trial duration, patient posture, assistive device use, and recovery phase. Free-text should be retained for clinician nuance but should not be the only data source.

### 2.3 Identity and respect are part of the clinical interface

The post-GAS aftercare literature notes that transgender individuals may face barriers to care due to lack of knowledge, transphobia, and misgendering, and that gender-affirmative care should be integrated in specialist and general care settings [7]. This makes identity handling a safety and access issue, not merely a demographic preference.

The specific UI requirement for name in use and pronouns is an interface-level implication from this evidence. The reviewed sources support the need to reduce misgendering and improve gender-affirmative care; RehabRoute should operationalize that need through structured identity fields.

**Requirement:** Patient identity fields should include name in use, legal name when required for billing or records, pronouns, gender identity, sex assigned at birth when clinically relevant, and anatomy/procedure inventory when clinically relevant. The UI should avoid forcing clinicians to infer anatomy or care needs from gender labels.

---

## 3. Points of divergence

### 3.1 Lab-based assessment versus real-world assessment

Some sources emphasize high-accuracy lab or clinic instruments. Chen et al. discuss high-precision force-plate COP trajectories and the methodological importance of standardized testing conditions [1]. AMTI emphasizes mounted platforms with high measurement accuracy, uniformity, force sensitivity, and dynamic range [6].

Other sources push toward portability and real-world data. BTrackS emphasizes lightweight portable force-plate design [5]. Abdollahi et al. argue that wearable IMUs may be preferable when force plates constrain data collection to labs, and they propose wearable and smartphone approaches for ADL-relevant monitoring once validated [3].

**Design interpretation:** RehabRoute should not choose one environment as universally superior. It should support both high-fidelity lab assessment and lower-burden real-world monitoring, while clearly marking the confidence level and clinical use case for each data stream.

### 3.2 Assessment duration and reliability

There is no single universally ideal sampling duration. Chen et al. report that static standing assessment parameters are generally stable and reliable within 25-40 seconds, while dynamic trials may require shorter durations depending on patient condition and task type [1]. Aryan et al. used 30-second quiet-standing trials in sub-acute stroke and found high reliability for selected time-domain measures such as AP-COP mean speed and directional weight-bearing asymmetry [2]. However, the same study notes that frequency-domain measures may need longer signals, and that trials longer than one minute have been recommended for computing sample entropy [2].

**Design interpretation:** RehabRoute should not hard-code one trial duration for all metrics. The protocol builder should link each metric to its recommended sampling duration, reliability caveats, and fatigue risk.

### 3.3 Procedure-specific aftercare versus generalized recovery advice

AOTA notes that surgical precautions and restrictions vary by clinical program and surgeon [9]. de Brouwer et al. show that patients want clearer recovery guidance and more access to aftercare, but the exact content depends on procedure, complications, and patient characteristics [7]. Bishop et al. show broad variation in reported pain and dysfunction outcomes after different GAS procedures [8].

**Design interpretation:** RehabRoute should avoid a single generic post-GAS checklist. Recovery guidance should be modular and procedure-specific, with clinician approval before patient release.

---

## 4. Gaps in the literature for UI/UX design

### 4.1 Explicit UI accessibility standards are missing

The provided sources do not specify UI/UX accessibility standards such as WCAG compliance, color contrast rules, minimum font sizes, low-vision modes, aphasia-friendly language, or interaction patterns for older adults and stroke survivors with cognitive or visual impairments. The clinical sources establish that balance, cognition, visual impairment, and ADL limitations matter [3], [4], but they do not translate these clinical realities into concrete interface accessibility rules.

**Research need:** Conduct usability testing with stroke survivors, older adults, clinicians, and TGD patients after GAS. Test readability, color contrast, step comprehension, fatigue, error recovery, and assisted-use workflows.

### 4.2 Context-filtering logic is not specified

The sources support the need for role-sensitive and context-specific care, but they do not define the back-end logic for visit-context filtering. For example, post-GAS sources support procedure-specific instructions and clear recovery guidance [7], [9], while balance sources support protocol metadata and assessment standardization [1], [2], [3]. None of the provided sources specify exactly how a system should decide which chart fields to hide, reveal, prioritize, or require for a given visit type.

**Research need:** Define and validate a rules engine that filters by visit purpose, clinician role, procedure history, recovery phase, safety flags, and patient preference.

### 4.3 HCI and unintended cognitive load are underdeveloped

Dual-task paradigms are clinically relevant because cognitive load can reveal fall risk during realistic activities [3]. BTrackS includes a cognitive-motor Stroop protocol that combines executive function demands with COP control [5]. However, this does not answer a separate HCI question: how much cognitive load the interface itself should impose during a balance test.

**Research need:** Distinguish intentional test load from unintentional interface load. During non-dual-task balance trials, UI instructions should be minimal, predictable, and consistent so the interface does not contaminate the measurement.

### 4.4 Outcome measures for post-GAS pain and dysfunction need standardization

Bishop et al. conclude that many GAS outcome studies do not systematically collect specific or standardized information about pain and dysfunction, and recommend recognized definitions and measures [8]. de Brouwer et al. identify patient-reported aftercare needs, but also note that aftercare received was not formally evaluated [7].

**Research need:** Build and validate standardized post-GAS outcome sets for pain, pelvic floor symptoms, urinary symptoms, dyspareunia, ADL/IADL limitations, mental health support, and return-to-work or return-to-school status.

---

## 5. Evidence-backed design requirements

| Requirement | Description | Evidence basis | Priority |
|---|---|---|---|
| Guided protocol mode | Use step-by-step workflows for force-plate and sensor assessments. Include setup, safety, trial start, trial stop, and report generation. | BTrackS onscreen guidance and protocolized software; force-plate standardization needs [1], [5]. | High |
| Protocol metadata capture | Store device type, trial duration, foot posture, surface, eyes open/closed, assistive devices, footwear/orthosis, and safety supports. | Force-plate assessment results vary by equipment, posture, trial duration, and conditions [1], [2]. | High |
| Metric reliability labeling | Label metrics by reliability and clinical caveats. Prioritize mean COP speed, directional WBA, and speed-based symmetry index for sub-acute stroke when force-plate data are available. | Aryan et al. reliability findings [2]. | High |
| Hybrid subjective/objective dashboard | Show clinical scales and instrumented metrics together rather than replacing one with the other. | Shift from subjective to objective methods, but continued use of BBS, TUG, BI, ADL tools [1], [3], [4]. | High |
| Visit-context filtering | Filter information by visit purpose, clinician role, recovery phase, procedure, and safety flags. | Multidisciplinary and procedure-specific aftercare needs [7], [8], [9]. | High |
| Identity-safe patient header | Display name in use and pronouns prominently while preserving legal/billing fields separately. | Misgendering and lack of gender-affirmative care are barriers to care [7]. | High |
| Procedure-specific aftercare modules | Provide modular instructions by surgery type, surgeon protocol, recovery phase, ADL limits, red flags, pelvic floor needs, and mental health support options. | Need for clear postoperative instructions, do's and don'ts, pelvic floor therapy, and psychological support [7], [8], [9]. | High |
| Data-source confidence tags | Mark data as lab force plate, portable force plate, wearable IMU, smartphone estimate, patient-reported, or clinician-observed. | Lab versus real-world assessment divergence and IMU validation needs [1], [3], [5], [6]. | Medium |
| Cognitive-load protection | Keep non-dual-task testing screens simple; only add cognitive tasks when clinically intended by protocol. | Cognitive-motor dual-task relevance and information-processing limits in balance control [1], [3], [5]. | Medium |
| Accessibility research track | Develop WCAG-aligned, stroke-accessible, low-vision, aphasia-friendly, and fatigue-aware UI standards. | Gap identified in reviewed corpus; clinical need implied by stroke and balance impairment literature [3], [4], [10]. | High |

---

## 6. Suggested information architecture for RehabRoute

### 6.1 Patient header

- Name in use
- Pronouns
- Legal name, only where administratively required
- Clinically relevant anatomy/procedure inventory
- Primary diagnosis or care pathway
- Mobility, vision, communication, and cognitive support needs
- Safety alerts and fall-risk flags

### 6.2 Assessment module

- Assessment type: clinical scale, force plate, wearable IMU, smartphone, clinician observation, patient report
- Protocol selection: quiet standing, dynamic balance, TUG, gait, dual-task, ADL-based monitoring
- Setup screen: foot posture, device calibration, assistive device, footwear/orthosis, visual condition, surface, safety support
- Trial screen: low-distraction instructions, timer, stop button, clinician safety override
- Results screen: validated metric summaries, raw data option, reliability caveats, trend view

### 6.3 Post-GAS aftercare module

- Procedure-specific recovery pathway
- Surgeon/program restrictions
- Recovery phase and expected milestones
- Do's and don'ts
- ADL/IADL checklist
- Pain and dysfunction screeners
- Pelvic floor therapy referral prompts
- Mental health support prompts
- Red flags and escalation rules
- Patient-facing instructions with clinician approval status

### 6.4 Context-filtering engine

A rules engine should use the following inputs:

1. Visit type: intake, post-op check, PT evaluation, OT evaluation, balance assessment, mental health follow-up, annual follow-up, urgent concern.
2. Clinician role: surgeon, PT, OT, nurse, psychologist, primary care, researcher.
3. Patient pathway: stroke, post-GAS, combined rehabilitation, general mobility.
4. Recovery phase: pre-op, immediate post-op, early recovery, late recovery, long-term maintenance.
5. Safety status: fall risk, wound concern, urinary retention, severe pain, psychological distress, ADL decline.
6. Patient communication/accessibility preferences.

The engine should hide irrelevant administrative details, surface relevant safety flags, and require structured fields only when they are necessary for the visit purpose.

---

## 7. Recommended next research steps

1. **Accessibility validation:** Test interface prototypes with stroke survivors, older adults, people with aphasia, low-vision users, and TGD patients after GAS.
2. **Metric validation:** Compare RehabRoute-generated force-plate and IMU summaries against validated clinical outcomes and fall events.
3. **Context-filtering evaluation:** Run clinician simulations to test whether role-based filtering hides too much, reveals too much, or improves decision speed.
4. **Post-GAS outcome set:** Define a standardized aftercare outcome battery for pain, urinary symptoms, pelvic floor function, dyspareunia, ADL/IADL performance, and mental health support.
5. **Cognitive-load testing:** Evaluate whether the interface itself alters balance-test performance during non-dual-task protocols.
6. **Vendor-data caution:** Treat BTrackS and AMTI product claims as interface and device-market evidence until verified against independent validation studies.

---

## 8. Limitations of this documentation

This file is a documentation synthesis of the provided sources, not a full systematic review. It does not claim that the uploaded sources exhaust all evidence on stroke rehabilitation, force plates, UI/UX accessibility, TGD care, or post-GAS rehabilitation. Several sources are product pages or professional toolkits rather than peer-reviewed studies. The UI requirements proposed here are evidence-informed design implications, not validated software requirements.

---

## End citations / references

[1] Chen, B., Liu, P., Xiao, F., Liu, Z., & Wang, Y. (2021). *Review of the Upright Balance Assessment Based on the Force Plate*. International Journal of Environmental Research and Public Health, 18(5), 2696. https://doi.org/10.3390/ijerph18052696

[2] Aryan, R., Inness, E., Patterson, K. K., Mochizuki, G., & Mansfield, A. (2023). *Reliability of force plate-based measures of standing balance in the sub-acute stage of post-stroke recovery*. Heliyon, 9, e21046. https://doi.org/10.1016/j.heliyon.2023.e21046

[3] Abdollahi, M., Whitton, N., Zand, R., Dombovy, M., Parnianpour, M., Khalaf, K., & Rashedi, E. (2022). *A Systematic Review of Fall Risk Factors in Stroke Survivors: Towards Improved Assessment Platforms and Protocols*. Frontiers in Bioengineering and Biotechnology, 10, 910698. https://doi.org/10.3389/fbioe.2022.910698

[4] Khan, F., & Chevidikunnan, M. F. (2021). *Prevalence of Balance Impairment and Factors Associated with Balance among Patients with Stroke. A Cross Sectional Retrospective Case Control Study*. Healthcare, 9(3), 320. https://doi.org/10.3390/healthcare9030320

[5] Balance Tracking Systems. (2026 page capture). *BTrackS - Affordable Force Plate Balance Systems*. https://balancetrackingsystems.com

[6] Advanced Mechanical Technology, Inc. (2026 page capture). *Precision Force Plates and Force Platforms for Biomechanics - AMTI*. https://www.amti.biz/product-line/force-plates/

[7] de Brouwer, I. J., Elaut, E., Becker-Hebly, I., Heylens, G., Nieder, T. O., van de Grift, T. C., & Kreukels, B. P. C. (2021). *Aftercare Needs Following Gender-Affirming Surgeries: Findings From the ENIGI Multicenter European Follow-Up Study*. The Journal of Sexual Medicine, 18(11), 1921-1932. https://doi.org/10.1016/j.jsxm.2021.08.005

[8] Bishop, M. D., Morgan-Daniel, J., & Alappattu, M. J. (2023). *Pain and Dysfunction Reported After Gender-Affirming Surgery: A Scoping Review*. Physical Therapy, 103(7), pzad045. https://doi.org/10.1093/ptj/pzad045

[9] American Occupational Therapy Association. (2023). *Working with TGD clients post-gender affirming surgery*. DEIJAB Toolkit: Transgender & Gender-Diverse Care.

[10] Centers for Disease Control and Prevention. (2024). *Stroke Facts*. https://www.cdc.gov/stroke/data-research/facts-stats/index.html
