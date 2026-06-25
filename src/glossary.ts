export interface GlossaryEntry {
  term: string;
  definition: string;
}

export const GLOSSARY: Record<string, string> = {
  NQF: 'The National Quality Framework: the federal/state agreement that regulates Australian early-childhood education and care. It sets the National Quality Standard (NQS) and is administered jointly by state/territory regulators and ACECQA.',
  NQS: 'The National Quality Standard: the seven Quality Areas a service is rated against. The five possible outcomes are Excellent, Exceeding NQS, Meeting NQS, Working Towards NQS, and Significant Improvement Required.',
  ACECQA: 'The Australian Children’s Education and Care Quality Authority — the national body that oversees the National Quality Framework, awards the "Excellent" rating, and publishes the public National Registers used here.',
  Excellent: 'The top NQS rating, awarded only on application by ACECQA to services already rated Exceeding NQS. Fewer than 30 services in Australia hold it at any one time.',
  'Exceeding NQS': 'The service exceeds the National Quality Standard in all seven Quality Areas. To exceed in a Quality Area, the service must demonstrate practice that is embedded, critically reflective, and shaped by meaningful engagement with families and communities.',
  'Meeting NQS': 'The service meets the National Quality Standard in all seven Quality Areas.',
  'Working Towards NQS': 'The service does not yet meet the National Quality Standard in one or more Quality Areas. Regulators continue to work with the service on improvement.',
  'Significant Improvement Required': 'The lowest NQS tier. Issued when regulators identify a significant risk to children’s safety, health, or wellbeing in one or more Quality Areas. Triggers a formal improvement notice.',
  'Quality Area': 'One of the seven domains the NQS is divided into: 1) Educational program & practice, 2) Children’s health & safety, 3) Physical environment, 4) Staffing arrangements, 5) Relationships with children, 6) Collaborative partnerships with families & communities, 7) Governance & leadership.',
  'Quality Area 1': 'Educational program and practice — the program for each child, the way it is documented, and how children’s learning is assessed and planned for.',
  'Quality Area 2': 'Children’s health and safety — incident management, hygiene, nutrition, safe sleep, supervision, and child protection.',
  'Quality Area 3': 'Physical environment — design, layout, fit-out, sustainability and resourcing of the service’s premises and outdoor space.',
  'Quality Area 4': 'Staffing arrangements — qualifications, ratios, organisation of staff, professional standards, and collaboration.',
  'Quality Area 5': 'Relationships with children — how educators interact with children: dignity, equity, behaviour guidance, and warmth.',
  'Quality Area 6': 'Collaborative partnerships with families and communities — how the service engages with parents, communities, and other agencies, including supporting transitions to school.',
  'Quality Area 7': 'Governance and leadership — leadership, management, continuous improvement, and the operating effectiveness of the service.',
  'Approved Places': 'The maximum number of children that can be enrolled or attending at any one time, set by the regulator. Approved places is a regulatory cap, not necessarily the number of children present today.',
  'Service Approval': 'The licence the state/territory regulator issues that lets a service legally operate. Has a unique number (SE-…) used here as the canonical service ID.',
  'Provider Approval': 'A separate licence held by the legal entity (company, association, person) operating one or more services. Has a unique number (PR-…). One provider can hold many service approvals.',
  'Long Day Care': 'A centre-based service offering education and care for children aged 0–6 typically for 8+ hours a day, year-round. The most common service type in Australia.',
  Preschool: 'Education-focused service for the year before school, typically 3–5 year olds, on shorter hours. Funded and regulated differently in each state.',
  Kindergarten: 'Used in some states (VIC, NT, WA, ACT, TAS) as the equivalent term for the preschool year.',
  OSHC: 'Outside School Hours Care — services that operate before school, after school, and during vacation periods, primarily for school-aged children.',
  'Family Day Care': 'Education and care provided in an educator’s home, regulated under an umbrella service. A network of small home-based services.',
  'Centre-Based Care': 'Education and care provided at a dedicated centre (not in a school or a home).',
  'Rating Cycle': 'The published assessment of a service against the NQS. Services are re-assessed on a rolling basis; the data here includes both the current and previous cycle ratings, where available.',
};

export function getGlossary(term: string): string | undefined {
  return GLOSSARY[term];
}
