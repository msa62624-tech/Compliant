// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  USER = "USER",
  CONTRACTOR = "CONTRACTOR",
  SUBCONTRACTOR = "SUBCONTRACTOR",
  BROKER = "BROKER",
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
}

// Auth Types
export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, "password">;
  accessToken?: string; // Optional for backward compatibility
  refreshToken?: string; // Optional for backward compatibility
}

export interface RefreshTokenDto {
  refreshToken: string;
}

// Contractor Types
export interface Contractor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  contractorType: ContractorType;
  status: ContractorStatus;
  insuranceStatus: InsuranceStatus;
  brokerName?: string;
  brokerEmail?: string;
  brokerPhone?: string;
  brokerCompany?: string;
  brokerType?: BrokerType;
  brokerGlName?: string;
  brokerGlEmail?: string;
  brokerGlPhone?: string;
  brokerAutoName?: string;
  brokerAutoEmail?: string;
  brokerAutoPhone?: string;
  brokerUmbrellaName?: string;
  brokerUmbrellaEmail?: string;
  brokerUmbrellaPhone?: string;
  brokerWcName?: string;
  brokerWcEmail?: string;
  brokerWcPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ContractorType {
  GENERAL_CONTRACTOR = "GENERAL_CONTRACTOR",
  SUBCONTRACTOR = "SUBCONTRACTOR",
}

export enum BrokerType {
  GLOBAL = "GLOBAL",
  PER_POLICY = "PER_POLICY",
}

export enum ContractorStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
  SUSPENDED = "SUSPENDED",
}

export enum InsuranceStatus {
  COMPLIANT = "COMPLIANT",
  NON_COMPLIANT = "NON_COMPLIANT",
  PENDING = "PENDING",
  EXPIRED = "EXPIRED",
}

export interface CreateContractorDto {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  contractorType?: ContractorType;
  brokerName?: string;
  brokerEmail?: string;
  brokerPhone?: string;
  brokerCompany?: string;
  brokerType?: BrokerType;
}

export interface UpdateContractorDto {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: ContractorStatus;
}

// Project Types
export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum ProjectStatus {
  PLANNING = "PLANNING",
  ACTIVE = "ACTIVE",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  status?: ProjectStatus;
}

// Insurance Types
export interface InsuranceDocument {
  id: string;
  contractorId: string;
  type: InsuranceType;
  provider: string;
  policyNumber: string;
  coverageAmount: number;
  effectiveDate: Date;
  expirationDate: Date;
  status: DocumentStatus;
  fileUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum InsuranceType {
  GENERAL_LIABILITY = "GENERAL_LIABILITY",
  WORKERS_COMPENSATION = "WORKERS_COMPENSATION",
  AUTO_LIABILITY = "AUTO_LIABILITY",
  PROFESSIONAL_LIABILITY = "PROFESSIONAL_LIABILITY",
  UMBRELLA = "UMBRELLA",
}

export enum DocumentStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

export interface CreateInsuranceDocumentDto {
  contractorId: string;
  type: InsuranceType;
  provider: string;
  policyNumber: string;
  coverageAmount: number;
  effectiveDate: Date;
  expirationDate: Date;
  fileUrl?: string;
}

// Generated COI Types
export interface GeneratedCOI {
  id: string;
  projectId: string;
  subcontractorId: string;
  projectName?: string;
  gcName?: string;
  subcontractorName?: string;
  status: COIStatus;
  brokerName?: string;
  brokerEmail?: string;
  brokerPhone?: string;
  brokerCompany?: string;
  brokerGlName?: string;
  brokerGlEmail?: string;
  brokerGlPhone?: string;
  brokerAutoName?: string;
  brokerAutoEmail?: string;
  brokerAutoPhone?: string;
  brokerUmbrellaName?: string;
  brokerUmbrellaEmail?: string;
  brokerUmbrellaPhone?: string;
  brokerWcName?: string;
  brokerWcEmail?: string;
  brokerWcPhone?: string;
  glPolicyUrl?: string;
  umbrellaPolicyUrl?: string;
  autoPolicyUrl?: string;
  wcPolicyUrl?: string;
  glBrokerSignatureUrl?: string;
  umbrellaBrokerSignatureUrl?: string;
  autoBrokerSignatureUrl?: string;
  wcBrokerSignatureUrl?: string;
  glExpirationDate?: Date;
  umbrellaExpirationDate?: Date;
  autoExpirationDate?: Date;
  wcExpirationDate?: Date;
  firstCOIUploaded: boolean;
  firstCOIUrl?: string;
  assignedAdminEmail?: string;
  deficiencyNotes?: string;
  rejectionReason?: string;
  uploadedForReviewDate?: Date;
  brokerVerifiedAtRenewal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum COIStatus {
  AWAITING_BROKER_INFO = "AWAITING_BROKER_INFO",
  AWAITING_BROKER_UPLOAD = "AWAITING_BROKER_UPLOAD",
  AWAITING_BROKER_SIGNATURE = "AWAITING_BROKER_SIGNATURE",
  AWAITING_ADMIN_REVIEW = "AWAITING_ADMIN_REVIEW",
  ACTIVE = "ACTIVE",
  DEFICIENCY_PENDING = "DEFICIENCY_PENDING",
  EXPIRED = "EXPIRED",
}

export interface CreateGeneratedCOIDto {
  projectId: string;
  subcontractorId: string;
  projectName?: string;
  gcName?: string;
  subcontractorName?: string;
}

export interface UpdateGeneratedCOIDto {
  status?: COIStatus;
  brokerName?: string;
  brokerEmail?: string;
  brokerPhone?: string;
  brokerCompany?: string;
  glPolicyUrl?: string;
  umbrellaPolicyUrl?: string;
  autoPolicyUrl?: string;
  wcPolicyUrl?: string;
  glBrokerSignatureUrl?: string;
  umbrellaBrokerSignatureUrl?: string;
  autoBrokerSignatureUrl?: string;
  wcBrokerSignatureUrl?: string;
  glExpirationDate?: Date;
  umbrellaExpirationDate?: Date;
  autoExpirationDate?: Date;
  wcExpirationDate?: Date;
  assignedAdminEmail?: string;
  deficiencyNotes?: string;
  rejectionReason?: string;
}

// Project Subcontractor Types
export interface ProjectSubcontractor {
  id: string;
  projectId: string;
  subcontractorId: string;
  role?: string;
  assignedAt: Date;
}

export interface CreateProjectSubcontractorDto {
  projectId: string;
  subcontractorId: string;
  role?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Error Types
export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}
