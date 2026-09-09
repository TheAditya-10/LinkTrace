import type { CaseData } from '@/types'

const caseId = 'case-harbor'

export const harborRoad: CaseData = {
  case: {
    id: caseId,
    name: 'Harbor Road Homicide',
    caseNumber: 'CP/HOM/2025/0973',
    status: 'closed',
    riskLevel: 'medium',
    entityCount: 9,
    relationshipCount: 11,
    lastUpdated: '2026-01-18T16:00:00+05:30',
    openedDate: '2025-10-04T22:30:00+05:30',
    summary:
      'Fatal altercation outside a Harbor Road warehouse; an initial alibi contradiction was resolved through CCTV recovery, leading to conviction.',
    leadInvestigator: 'Insp. Meera Iyer',
    jurisdiction: 'Chennai City Police, Harbour Division',
  },
  entities: [
    { id: 'hbr-e1', caseId, type: 'person', label: 'Selvam Muthu', aliases: [], riskScore: 25, confidence: 1, attributes: { Age: '44', Role: 'Victim' }, evidenceIds: ['hbr-ev1'], firstSeen: '2025-10-04', lastSeen: '2025-10-04' },
    { id: 'hbr-e2', caseId, type: 'person', label: 'Karthik Raman', aliases: ['Katti'], riskScore: 82, confidence: 0.93, attributes: { Age: '29', Role: 'Accused', 'Known Address': 'Royapuram, Chennai' }, evidenceIds: ['hbr-ev2', 'hbr-ev4', 'hbr-ev6'], firstSeen: '2025-10-04', lastSeen: '2026-01-10' },
    { id: 'hbr-e3', caseId, type: 'person', label: 'Bala Subramaniam', aliases: [], riskScore: 55, confidence: 0.85, attributes: { Age: '31', Role: 'Witness / associate of accused' }, evidenceIds: ['hbr-ev3', 'hbr-ev5'], firstSeen: '2025-10-04', lastSeen: '2025-12-02' },
    { id: 'hbr-e4', caseId, type: 'location', label: 'Warehouse Lane, Harbor Road', aliases: ['Crime scene'], riskScore: 0, confidence: 1, attributes: { Type: 'Industrial lane' }, evidenceIds: ['hbr-ev1'], firstSeen: '2025-10-04', lastSeen: '2025-10-04' },
    { id: 'hbr-e5', caseId, type: 'phone', label: '+91 93450-6XXXX', aliases: ["Raman's phone"], riskScore: 60, confidence: 0.88, attributes: { Carrier: 'BSNL prepaid' }, evidenceIds: ['hbr-ev2'], firstSeen: '2025-10-04', lastSeen: '2026-01-10' },
    { id: 'hbr-e6', caseId, type: 'vehicle', label: 'TN-01-CV-8823', aliases: ['Black Pulsar motorcycle'], riskScore: 50, confidence: 0.8, attributes: { 'Registered Owner': 'Karthik Raman' }, evidenceIds: ['hbr-ev4'], firstSeen: '2025-10-04', lastSeen: '2025-10-04' },
    { id: 'hbr-e7', caseId, type: 'location', label: 'Ganesh Bar & Restaurant', aliases: ['Alibi location'], riskScore: 15, confidence: 0.9, attributes: { Type: 'Bar', Area: 'Royapuram' }, evidenceIds: ['hbr-ev3', 'hbr-ev6'], firstSeen: '2025-10-04', lastSeen: '2025-10-04' },
    { id: 'hbr-e8', caseId, type: 'event', label: 'Fatal altercation', aliases: [], riskScore: 0, confidence: 1, attributes: { Date: '2025-10-04', Time: '22:15 IST' }, evidenceIds: ['hbr-ev1', 'hbr-ev6'], firstSeen: '2025-10-04', lastSeen: '2025-10-04' },
    { id: 'hbr-e9', caseId, type: 'person', label: 'Inspector Meera Iyer', aliases: [], riskScore: 0, confidence: 1, attributes: { Role: 'Investigating officer' }, evidenceIds: [], firstSeen: '2025-10-04', lastSeen: '2026-01-18' },
  ],
  relationships: [
    { id: 'hbr-r1', caseId, sourceId: 'hbr-e2', targetId: 'hbr-e1', type: 'co-occurrence', label: 'present at altercation', weight: 0.9, occurrenceCount: 1, predicted: false, confidence: 0.9, evidenceIds: ['hbr-ev1'], firstSeen: '2025-10-04', lastSeen: '2025-10-04', description: 'Witnesses place Raman at the scene shortly before the victim was found.' },
    { id: 'hbr-r2', caseId, sourceId: 'hbr-e2', targetId: 'hbr-e5', type: 'ownership', label: 'owns phone', weight: 0.9, occurrenceCount: 1, predicted: false, confidence: 0.9, evidenceIds: ['hbr-ev2'], firstSeen: '2025-10-04', lastSeen: '2026-01-10', description: 'KYC-registered device.' },
    { id: 'hbr-r3', caseId, sourceId: 'hbr-e5', targetId: 'hbr-e4', type: 'movement', label: 'tower ping near scene', weight: 0.75, occurrenceCount: 3, predicted: false, confidence: 0.82, evidenceIds: ['hbr-ev2'], firstSeen: '2025-10-04', lastSeen: '2025-10-04', description: 'Cell tower triangulation places the phone within 200m of the crime scene at 22:05–22:20 IST.' },
    { id: 'hbr-r4', caseId, sourceId: 'hbr-e2', targetId: 'hbr-e6', type: 'ownership', label: 'registered owner', weight: 0.9, occurrenceCount: 1, predicted: false, confidence: 0.92, evidenceIds: ['hbr-ev4'], firstSeen: '2025-10-04', lastSeen: '2025-10-04', description: 'RTO registry confirms ownership.' },
    { id: 'hbr-r5', caseId, sourceId: 'hbr-e6', targetId: 'hbr-e4', type: 'movement', label: 'seen near scene', weight: 0.7, occurrenceCount: 1, predicted: false, confidence: 0.78, evidenceIds: ['hbr-ev4'], firstSeen: '2025-10-04', lastSeen: '2025-10-04', description: 'A partial plate match on a nearby traffic camera, later confirmed via full CCTV recovery.' },
    { id: 'hbr-r6', caseId, sourceId: 'hbr-e3', targetId: 'hbr-e2', type: 'association', label: 'known associate', weight: 0.65, occurrenceCount: 1, predicted: false, confidence: 0.85, evidenceIds: ['hbr-ev3'], firstSeen: '2025-10-04', lastSeen: '2025-12-02', description: 'Bala Subramaniam identified as a close associate who provided an initial alibi statement.' },
    { id: 'hbr-r7', caseId, sourceId: 'hbr-e3', targetId: 'hbr-e7', type: 'co-occurrence', label: 'initial alibi statement', weight: 0.5, occurrenceCount: 1, predicted: false, confidence: 0.4, evidenceIds: ['hbr-ev3'], firstSeen: '2025-10-04', lastSeen: '2025-10-04', description: 'Subramaniam initially stated Raman was with him at this bar during the altercation window — later contradicted.' },
    { id: 'hbr-r8', caseId, sourceId: 'hbr-e2', targetId: 'hbr-e7', type: 'co-occurrence', label: 'claimed alibi location', weight: 0.3, occurrenceCount: 1, predicted: false, confidence: 0.25, evidenceIds: ['hbr-ev3', 'hbr-ev6'], firstSeen: '2025-10-04', lastSeen: '2025-10-04', description: 'Raman\'s claimed location during the murder window — contradicted and resolved by recovered CCTV footage.' },
    { id: 'hbr-r9', caseId, sourceId: 'hbr-e2', targetId: 'hbr-e8', type: 'co-occurrence', label: 'accused', weight: 0.95, occurrenceCount: 1, predicted: false, confidence: 0.95, evidenceIds: ['hbr-ev6'], firstSeen: '2025-10-04', lastSeen: '2025-10-04', description: 'CCTV footage recovered from an adjacent shop places Raman at the scene at 22:14 IST, one minute before the recorded time of the altercation.' },
    { id: 'hbr-r10', caseId, sourceId: 'hbr-e1', targetId: 'hbr-e8', type: 'co-occurrence', label: 'victim', weight: 0.95, occurrenceCount: 1, predicted: false, confidence: 1, evidenceIds: ['hbr-ev1'], firstSeen: '2025-10-04', lastSeen: '2025-10-04', description: 'Selvam Muthu was the victim of the altercation.' },
    { id: 'hbr-r11', caseId, sourceId: 'hbr-e4', targetId: 'hbr-e8', type: 'co-occurrence', label: 'scene of event', weight: 0.95, occurrenceCount: 1, predicted: false, confidence: 1, evidenceIds: ['hbr-ev1'], firstSeen: '2025-10-04', lastSeen: '2025-10-04', description: 'Location of the fatal altercation.' },
  ],
  evidence: [
    { id: 'hbr-ev1', caseId, sourceType: 'FIR', title: 'FIR CP/HOM/2025/0973', excerpt: 'On 4 Oct 2025 at approx. 22:15 IST, Selvam Muthu was found fatally injured on Warehouse Lane, Harbor Road. Two bystanders reported seeing a man matching Raman\'s description fleeing the scene.', timestamp: '2025-10-04T23:00:00+05:30', reliability: 'confirmed', relatedEntityIds: ['hbr-e1', 'hbr-e4', 'hbr-e8'], relatedRelationshipIds: ['hbr-r1', 'hbr-r10', 'hbr-r11'] },
    { id: 'hbr-ev2', caseId, sourceType: 'CDR', title: 'CDR & tower log — 93450-6XXXX', excerpt: "Raman's registered phone ping-triangulated within 200m of Warehouse Lane at 22:05, 22:12, and 22:20 IST.", timestamp: '2025-10-06T10:00:00+05:30', reliability: 'confirmed', relatedEntityIds: ['hbr-e2', 'hbr-e5'], relatedRelationshipIds: ['hbr-r2', 'hbr-r3'] },
    { id: 'hbr-ev3', caseId, sourceType: 'FIR', title: 'Initial statement of Bala Subramaniam', excerpt: 'Recorded 5 Oct 2025: Subramaniam states Raman was with him at Ganesh Bar & Restaurant from 21:30 to 23:00 IST on the night of the incident.', timestamp: '2025-10-05T12:00:00+05:30', reliability: 'unverified', relatedEntityIds: ['hbr-e2', 'hbr-e3', 'hbr-e7'], relatedRelationshipIds: ['hbr-r6', 'hbr-r7', 'hbr-r8'], contradictsEvidenceId: 'hbr-ev6', contradictionNote: 'Alibi placed Raman at the bar during the exact window CCTV later showed him at the crime scene.' },
    { id: 'hbr-ev4', caseId, sourceType: 'Vehicle Registry', title: 'Traffic camera partial plate match', excerpt: 'A traffic camera 300m from the scene recorded a black Pulsar motorcycle with a partial plate match to TN-01-CV-8823 at 22:10 IST.', timestamp: '2025-10-07T09:00:00+05:30', reliability: 'probable', relatedEntityIds: ['hbr-e2', 'hbr-e6'], relatedRelationshipIds: ['hbr-r4', 'hbr-r5'] },
    { id: 'hbr-ev5', caseId, sourceType: 'FIR', title: 'Follow-up statement of Bala Subramaniam', excerpt: 'Recorded 3 Dec 2025, after being shown CCTV evidence: Subramaniam admits his earlier alibi statement was false, made under pressure from Raman.', timestamp: '2025-12-03T14:00:00+05:30', reliability: 'confirmed', relatedEntityIds: ['hbr-e3'], relatedRelationshipIds: ['hbr-r6'] },
    { id: 'hbr-ev6', caseId, sourceType: 'Surveillance', title: 'Recovered CCTV footage — adjacent shop camera', excerpt: 'Footage recovered on 15 Nov 2025 from a shop 40m from the crime scene shows Raman entering Warehouse Lane at 22:14 IST and leaving at 22:19 IST, directly contradicting the bar alibi.', timestamp: '2025-11-15T18:00:00+05:30', reliability: 'confirmed', relatedEntityIds: ['hbr-e2', 'hbr-e8'], relatedRelationshipIds: ['hbr-r8', 'hbr-r9'] },
  ],
  timeline: [
    { id: 'hbr-t1', caseId, timestamp: '2025-10-04T22:15:00+05:30', type: 'alert', title: 'Fatal altercation reported', description: 'Selvam Muthu found fatally injured on Warehouse Lane.', entityIds: ['hbr-e1', 'hbr-e4', 'hbr-e8'], relationshipId: 'hbr-r10' },
    { id: 'hbr-t2', caseId, timestamp: '2025-10-05T12:00:00+05:30', type: 'evidence_added', title: 'Initial alibi recorded', description: 'Subramaniam states Raman was at Ganesh Bar during the incident window.', entityIds: ['hbr-e2', 'hbr-e3', 'hbr-e7'], relationshipId: 'hbr-r7' },
    { id: 'hbr-t3', caseId, timestamp: '2025-10-06T10:00:00+05:30', type: 'movement', title: 'Tower data contradicts alibi', description: "Raman's phone pings place him near the crime scene, not the bar.", entityIds: ['hbr-e2', 'hbr-e5'], relationshipId: 'hbr-r3' },
    { id: 'hbr-t4', caseId, timestamp: '2025-10-07T09:00:00+05:30', type: 'movement', title: 'Vehicle partial match found', description: "Traffic camera captures a motorcycle matching Raman's near the scene.", entityIds: ['hbr-e2', 'hbr-e6'], relationshipId: 'hbr-r5' },
    { id: 'hbr-t5', caseId, timestamp: '2025-11-15T18:00:00+05:30', type: 'evidence_added', title: 'CCTV recovered', description: 'Adjacent shop footage places Raman at the scene at 22:14 IST.', entityIds: ['hbr-e2', 'hbr-e8'], relationshipId: 'hbr-r9' },
    { id: 'hbr-t6', caseId, timestamp: '2025-12-03T14:00:00+05:30', type: 'evidence_added', title: 'Contradiction resolved', description: 'Subramaniam retracts his alibi statement after being shown the CCTV footage.', entityIds: ['hbr-e3'], relationshipId: 'hbr-r6' },
    { id: 'hbr-t7', caseId, timestamp: '2026-01-10T00:00:00+05:30', type: 'alert', title: 'Chargesheet filed', description: 'Chargesheet filed against Karthik Raman based on CCTV, tower data, and revised witness statement.', entityIds: ['hbr-e2'] },
    { id: 'hbr-t8', caseId, timestamp: '2026-01-18T16:00:00+05:30', type: 'evidence_added', title: 'Case closed', description: 'Case marked closed following chargesheet filing and handover for trial.', entityIds: ['hbr-e9'] },
  ],
  leads: [
    { id: 'hbr-l1', caseId, entityIds: ['hbr-e2', 'hbr-e8'], relationshipId: 'hbr-r9', priority: 'critical', reason: 'CCTV directly places accused at scene during time of death, resolving prior contradiction', createdAt: '2025-11-15T18:05:00+05:30' },
    { id: 'hbr-l2', caseId, entityIds: ['hbr-e2', 'hbr-e6'], relationshipId: 'hbr-r5', priority: 'medium', reason: 'Vehicle sighting corroborates tower-ping location', createdAt: '2025-10-07T09:05:00+05:30' },
    { id: 'hbr-l3', caseId, entityIds: ['hbr-e3', 'hbr-e2'], relationshipId: 'hbr-r6', priority: 'low', reason: 'Witness retraction strengthens the prosecution timeline — resolved, closed case', createdAt: '2025-12-03T14:05:00+05:30' },
  ],
  alerts: [
    { id: 'hbr-a1', caseId, type: 'contradiction', priority: 'high', title: 'Contradiction found', description: "Subramaniam's alibi conflicts with tower and CCTV data.", timestamp: '2025-10-06T10:05:00+05:30', read: true, targetEntityId: 'hbr-e3', targetRelationshipId: 'hbr-r7' },
    { id: 'hbr-a2', caseId, type: 'new_evidence', priority: 'critical', title: 'CCTV recovered', description: 'Footage directly places the accused at the scene.', timestamp: '2025-11-15T18:10:00+05:30', read: true, targetEntityId: 'hbr-e2' },
    { id: 'hbr-a3', caseId, type: 'new_evidence', priority: 'medium', title: 'Contradiction resolved', description: 'Witness retracted false alibi statement.', timestamp: '2025-12-03T14:10:00+05:30', read: true, targetEntityId: 'hbr-e3' },
  ],
}
