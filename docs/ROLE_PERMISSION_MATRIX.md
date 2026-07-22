# TechPath Role and Permission Matrix

| Capability | Admin | Recruiter | Candidate |
|---|---:|---:|---:|
| View all enquiries and consultations | Yes | No | No |
| Approve/reject enquiry | Yes | No | No |
| Send/revoke account invitation | Yes | No | No |
| Manage NDA templates and signatures | Yes | No | Own signature only |
| View all candidates | Yes | No | No |
| View assigned candidates | Yes | Yes | Own record only |
| Assign/reassign recruiter | Yes | No | No |
| Update journey/marketing stage | Yes | Assigned only | No |
| Create/update applications | Yes | Assigned only | No |
| Create/update interview/assessment events | Yes | Assigned only | No |
| Manage candidate documents | Yes | Assigned only | No by default |
| Manage training catalog | Yes | No | No |
| Assign/update candidate training | Yes | Assigned only | No by default |
| Broadcast announcements | Yes | No | No |
| Send targeted announcement | Yes | Assigned only | No |
| Message candidate/recruiter | Yes | Assigned only | Assigned recruiter only |
| View reports | Yes | Limited/assigned scope only | No |
| Manage staff roles | Yes | No | No |
| Change own password | Yes | Yes | Yes |

Every permission must be enforced in server-side code. Navigation visibility is not authorization.

## Phase 4 permissions

| Capability | Admin | Recruiter | Candidate |
|---|---:|---:|---:|
| View recruiter workloads | All recruiters | Own workload | No |
| Assign/reassign/unassign recruiter | Yes | No | No |
| Edit staff profile/capacity/availability | Yes | No | No |
| View assignment history | All candidates | Assigned candidates | Current recruiter only through profile card |
| Update journey stage | All candidates | Assigned candidates | No |
| View internal journey notes | Yes | Assigned candidates | No |
| View candidate-visible journey history | Yes | Assigned candidates | Own history |
| Update marketing lifecycle | All candidates | Assigned candidates | No |
| View marketing status | Yes | Assigned candidates | Own status |

## Phase 5 application activity

| Capability | Admin | Recruiter | Candidate |
|---|---:|---:|---:|
| View all applications | Yes | No | No |
| View assigned-candidate applications | Yes | Yes | Own only |
| Create/update application | Yes | Assigned only | No |
| Schedule/update interview or assessment | Yes | Assigned only | No |
| View internal application/event notes | Yes | Assigned only | No |
| View candidate-visible interview/assessment details | Yes | Assigned only | Own only |
| Update results or scores | Yes | Assigned only | No |
