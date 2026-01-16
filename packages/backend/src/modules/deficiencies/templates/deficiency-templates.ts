export const DEFICIENCY_TEMPLATES = [
  {
    category: 'COVERAGE_AMOUNT',
    severity: 'HIGH',
    description: 'Coverage amount is below required minimum',
    requiredAction: 'Update insurance policy to meet minimum coverage requirements: General Liability $1M per occurrence, $2M aggregate',
  },
  {
    category: 'EXPIRED_POLICY',
    severity: 'CRITICAL',
    description: 'Insurance policy has expired',
    requiredAction: 'Provide current, valid insurance certificate with effective dates',
  },
  {
    category: 'MISSING_ENDORSEMENT',
    severity: 'HIGH',
    description: 'Required endorsement is missing from certificate',
    requiredAction: 'Obtain and submit certificate with all required endorsements',
  },
  {
    category: 'INCORRECT_NAMED_INSURED',
    severity: 'MEDIUM',
    description: 'Named insured does not match contractor information',
    requiredAction: 'Provide certificate with correct named insured information',
  },
  {
    category: 'MISSING_ADDITIONAL_INSURED',
    severity: 'HIGH',
    description: 'Certificate holder not listed as additional insured',
    requiredAction: 'Update certificate to include certificate holder as additional insured',
  },
];
