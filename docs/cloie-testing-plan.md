# CLOIE Testing Plan

## Evaluation Template Types and CILO Binding Test Plan

| Test Case ID | Test Case | Testing Resource (Tester's name and role) | Testing Approach | Test Schedule | Risks and Issues |
| --- | --- | --- | --- | --- | --- |
| ETT-CB-001 | Course-bound template publication with CILO-question bindings | QA Tester / Faculty workflow tester | Service and UI test using saved course CILOs, Likert question binding, year-level targeting, and student assignment verification | Sprint verification before release | Duplicate or incomplete bindings may block publication; stale CILOs must use snapshots |
| ETT-PW-001 | Program-wide deployment to one selected stakeholder role | QA Tester / Program Head workflow tester | Service and UI test for Student, Alumni, and Industry Partner deployment paths | Sprint verification before release | Student deployments require year level; incorrect role filtering can over-assign respondents |
| OUT-001 | CILO and GO schema simplification | Developer / Database tester | Schema, service, and regression tests for CILO save/load and GO create/update without persisted order fields | Before migration and seed validation | Existing seed/demo data may reference removed columns |
| RESP-001 | Course-bound response analytics with CILO summaries | QA Tester / Reviewer workflow tester | Submit responses and verify per-question means plus CILO-level mean summaries from binding snapshots | After response workflow verification | Missing binding IDs in older responses must fall back safely |

## Test Case ETT-CB-001

Test Case ID: ETT-CB-001  
Test Case Name: Publish course-bound evaluation with CILO bindings  
Tester: QA Tester / Faculty workflow tester  
Testing Schedule: Sprint verification before release

| Test Scenario | Pre-conditions | Test Steps | Expected Results | Actual Results | Status (Passed/Failed) |
| --- | --- | --- | --- | --- | --- |
| Faculty publishes a course-bound evaluation from a course-bound template | Faculty has an active program affiliation, an active course-bound template, a selected course, saved CILOs, and target year levels | Select template, enter deployed evaluation name, select course type/course, load CILOs, bind each CILO to a unique Likert question, select year levels, publish | Evaluation, targets, assignments, CILO snapshots, and CILO-question bindings are created in one transaction | TBD | TBD |
| Faculty attempts incomplete CILO binding | At least one saved CILO is loaded | Leave one CILO unbound or bind two CILOs to the same Likert question, then publish | Publication is blocked with a clear validation message | TBD | TBD |
| Faculty selects a program-wide template in course-bound flow | A program-wide template exists | Attempt to publish through faculty course-bound flow | Template is unavailable or rejected by backend validation | TBD | TBD |

## Test Case ETT-PW-001

Test Case ID: ETT-PW-001  
Test Case Name: Publish program-wide evaluation to one stakeholder role  
Tester: QA Tester / Program Head workflow tester  
Testing Schedule: Sprint verification before release

| Test Scenario | Pre-conditions | Test Steps | Expected Results | Actual Results | Status (Passed/Failed) |
| --- | --- | --- | --- | --- | --- |
| Program Head publishes to Students | Program Head has active program assignment, active program-wide template, and year levels exist | Select template, enter deployed evaluation name, choose Student, select year level, schedule, publish | Central deployment is created for `STUDENT`; assignments are created only for matching students in the selected year level | TBD | TBD |
| Program Head publishes to Alumni | Alumni users exist in the program context | Select Alumni as the single target role and publish | Deployment is created for `ALUMNI`; assignments are created for alumni respondents only | TBD | TBD |
| Program Head publishes to Industry Partners | Industry partner profiles exist for the program | Select Industry Partners as the single target role and publish | Deployment is created for `INDUSTRY_PARTNER`; assignments are created for matching industry partners only | TBD | TBD |

## Test Case OUT-001

Test Case ID: OUT-001  
Test Case Name: Validate outcome schema simplification  
Tester: Developer / Database tester  
Testing Schedule: Before migration and seed validation

| Test Scenario | Pre-conditions | Test Steps | Expected Results | Actual Results | Status (Passed/Failed) |
| --- | --- | --- | --- | --- | --- |
| Save and load course CILOs | Faculty has access to a course | Add, edit, and load CILOs for the course | CILOs persist by course without `academic_term` or persisted `order`; display numbering is UI-only | TBD | TBD |
| Create and update GOs | Program Head has active program assignment | Create and edit Graduate Outcomes | GOs persist without `order`; lists remain stable by code/creation display logic | TBD | TBD |

## Test Case RESP-001

Test Case ID: RESP-001  
Test Case Name: Verify CILO analytics from bound Likert questions  
Tester: QA Tester / Reviewer workflow tester  
Testing Schedule: After response workflow verification

| Test Scenario | Pre-conditions | Test Steps | Expected Results | Actual Results | Status (Passed/Failed) |
| --- | --- | --- | --- | --- | --- |
| Student submits a bound course evaluation | Published course-bound evaluation has CILO-question bindings | Submit ratings for bound Likert questions | Quantitative response items store matching CILO binding IDs | TBD | TBD |
| Reviewer opens course-bound analytics | Submitted responses exist | Open review detail page | Section/question means and CILO mean summaries are shown using binding snapshots | TBD | TBD |
