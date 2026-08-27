// Shared domain types for the My Guyana data layer.
//
// The app has no server, so these JSDoc typedefs are the contract that the
// stores (src/data), the endpoints (src/api) and the screens all agree on.
// Editors type-check against them and `npm run build` keeps the JS honest;
// treat a change here as a change every layer must follow (models, seed,
// endpoints, validation, UI).

/** @typedef {'cashGrants'|'singleWindow'|'gro'} ServiceGroup */

/** @typedef {'draft'|'submitted'|'inReview'|'actionNeeded'|'approved'|'rejected'|'withdrawn'} ApplicationStatus */

/** @typedef {'pending'|'inReview'|'infoRequested'|'approved'|'rejected'|'notApplicable'} ReviewStatus */

/** @typedef {'unpaid'|'paid'|'waived'} FeeStatus */

/** @typedef {'birth'|'death'|'marriage'} GroCertificateType */

/** @typedef {'received'|'verification'|'registered'|'approved'|'rejected'} GroRegistrationStatus */

/** @typedef {'standard'|'expedited'} GroDeliveryTier */

/**
 * A government body. Seeded reference data — mirrors the agencies the real
 * Single Window routes to, plus the agencies owning the other services.
 * @typedef {Object} Agency
 * @property {string} id
 * @property {string} name
 * @property {string} shortName
 * @property {string} icon        lucide icon name
 * @property {string} mark        agency identity colour
 */

/**
 * One form field in a service's application. Rendered generically by the
 * apply engine, so adding a field is a seed change, not a new screen.
 * @typedef {Object} FieldDef
 * @property {string} key
 * @property {string} label
 * @property {'text'|'textarea'|'tel'|'email'|'date'|'number'|'select'|'radio'|'checkbox'} type
 * @property {string} [sectionId]
 * @property {boolean} [required]
 * @property {string} [hint]
 * @property {string} [placeholder]
 * @property {string} [defaultValue]  pre-selected before the citizen touches it
 * @property {{value: string, label: string}[]} [options]
 * @property {ValidationDef} [validate]
 * @property {{field: string, equals: string|string[]}} [showIf]  conditional visibility
 */

/**
 * Declarative validation for a field. Evaluated by src/api/validate.js so the
 * same rules run on save-draft, on section gating and on submit.
 * @typedef {Object} ValidationDef
 * @property {number} [min]        number: minimum value; text: minimum length
 * @property {number} [max]
 * @property {string} [pattern]    RegExp source
 * @property {string} [message]    message shown when the rule fails
 * @property {'past'|'future'|'notFuture'} [date]
 */

/**
 * A section of an application form. Sections gate: the citizen cannot leave
 * one until every required field in it validates.
 * @typedef {Object} SectionDef
 * @property {string} id
 * @property {string} title
 * @property {string} [description]
 */

/**
 * A document the application asks for.
 * @typedef {Object} DocumentDef
 * @property {string} id
 * @property {string} label
 * @property {string} issuer
 * @property {boolean} required
 * @property {string} [hint]
 * @property {string} [vaultKind]  matching Vault document kind, for "add from Vault"
 */

/**
 * A prerequisite the citizen must already hold before applying. Single Window
 * approvals are gated on proof of land ownership and outline planning
 * permission; the citizen confirms and evidences each one.
 * @typedef {Object} PrerequisiteDef
 * @property {string} id
 * @property {string} label
 * @property {string} detail
 * @property {string} issuedBy
 * @property {boolean} [evidenceRequired]  needs a reference number captured
 * @property {string} [evidenceLabel]
 */

/**
 * A service in the catalogue. Seeded reference data; the View screen, the
 * apply engine and the fee summary all render from this one record.
 * @typedef {Object} Service
 * @property {string} id
 * @property {string} slug
 * @property {string} name
 * @property {ServiceGroup} group
 * @property {string} agencyId          owning agency
 * @property {string} icon
 * @property {string} summary           one-line description
 * @property {string} overview          longer "what this is" copy
 * @property {string[]} steps           how the process runs, in order
 * @property {string[]} eligibilityRuleIds  keys into src/data/eligibilityRules.js
 * @property {string[]} eligibilityNotes    plain-language who-can-apply copy
 * @property {PrerequisiteDef[]} prerequisites
 * @property {SectionDef[]} sections
 * @property {FieldDef[]} fields
 * @property {DocumentDef[]} documents
 * @property {number} timeframeDays     published processing timeframe
 * @property {string} timeframeNote
 * @property {number} sortOrder
 * @property {boolean} active
 */

/**
 * A fee attached to a service. Amounts are Guyanese dollars.
 * @typedef {Object} ServiceFee
 * @property {string} id
 * @property {string} serviceId
 * @property {string} code
 * @property {string} label
 * @property {number} amountGyd
 * @property {'application'|'processing'|'inspection'|'connection'|'standard'|'expedited'} kind
 * @property {boolean} mandatory        charged on every application
 * @property {string} [note]
 */

/**
 * One hop in a service's approval routing — which agency reviews, in what
 * order, and how long they have. Seeded per service.
 * @typedef {Object} ServiceRoute
 * @property {string} id
 * @property {string} serviceId
 * @property {string} agencyId
 * @property {number} sequence
 * @property {'lead'|'reviewer'|'inspection'|'clearance'} role
 * @property {number} slaDays
 * @property {string} purpose           what this agency is checking
 * @property {'always'|'emptyPlot'} [appliesWhen]
 */

/**
 * An uploaded/attached document on an application.
 * @typedef {Object} AttachedDocument
 * @property {string} docId
 * @property {string} label
 * @property {boolean} required   whether the answers on the day made it required
 * @property {'missing'|'attached'|'fromVault'|'rejected'} status
 * @property {string|null} fileName
 * @property {number|null} size
 * @property {string|null} [vaultDocId]
 * @property {string} [attachedAt]
 */

/**
 * Common shape shared by cash grant and Single Window applications. The two
 * live in their own stores (they carry different detail), but every generic
 * screen — the Applications list, the tracker — reads this shape.
 * @typedef {Object} ApplicationBase
 * @property {string} id
 * @property {string} ref              citizen-facing reference number
 * @property {string} userId
 * @property {string} serviceId
 * @property {ServiceGroup} group
 * @property {string} agencyId
 * @property {string} title
 * @property {ApplicationStatus} status
 * @property {Record<string, string>} fields
 * @property {AttachedDocument[]} documents
 * @property {number} feeTotalGyd
 * @property {FeeStatus} feeStatus
 * @property {string|null} submittedAt   ISO timestamp; null while a draft
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string|null} decisionAt
 * @property {string|null} decisionNote
 */

/**
 * A cash grant application.
 * @typedef {ApplicationBase & {
 *   grantType: string,
 *   householdSize: number|null,
 *   bankAccountLast4: string|null,
 *   awardedAmountGyd: number|null,
 *   paidAt: string|null
 * }} CashGrantApplication
 */

/**
 * A Single Window application. Carries the land-development detail the
 * multi-agency routing is decided from.
 * @typedef {ApplicationBase & {
 *   parcelId: string,
 *   parcelAddress: string,
 *   region: string,
 *   ownershipProofRef: string,
 *   outlinePermissionRef: string|null,
 *   plotStatus: 'empty'|'developed',
 *   siteInvestigationRequired: boolean,
 *   currentSequence: number,
 *   prerequisites: Record<string, {confirmed: boolean, reference?: string}>
 * }} SingleWindowApplication
 */

/**
 * One agency's review of a Single Window application — the routing status
 * the citizen sees per agency on the tracker.
 * @typedef {Object} AgencyReview
 * @property {string} id
 * @property {string} applicationId
 * @property {string} agencyId
 * @property {number} sequence
 * @property {'lead'|'reviewer'|'inspection'|'clearance'} role
 * @property {ReviewStatus} status
 * @property {string} purpose
 * @property {number} slaDays
 * @property {string|null} startedAt
 * @property {string|null} decidedAt
 * @property {string|null} note
 */

/**
 * An entry on an application's timeline. Every state change writes one, so
 * the tracker is a projection of real events rather than a guess from a
 * step counter.
 * @typedef {Object} ApplicationEvent
 * @property {string} id
 * @property {string} applicationId
 * @property {string} at
 * @property {'created'|'submitted'|'routed'|'review'|'infoRequested'|'documentAdded'|'feePaid'|'approved'|'rejected'|'issued'} type
 * @property {string} label
 * @property {string} [note]
 * @property {string} [agencyId]
 */

/**
 * @typedef {Object} GroBirthRecord
 * @property {string} childName
 * @property {string} sex
 * @property {string} dateOfBirth
 * @property {string} placeOfBirth
 * @property {string} motherName
 * @property {string} motherMaidenName
 * @property {string} fatherName
 * @property {string} informant
 */

/**
 * @typedef {Object} GroDeathRecord
 * @property {string} deceasedName
 * @property {string} sex
 * @property {string} dateOfDeath
 * @property {string} placeOfDeath
 * @property {number} ageAtDeath
 * @property {string} causeOfDeath
 * @property {string} informant
 */

/**
 * @typedef {Object} GroMarriageRecord
 * @property {string} partyOneName
 * @property {string} partyTwoName
 * @property {string} dateOfMarriage
 * @property {string} placeOfMarriage
 * @property {string} officiant
 * @property {string} witnessOne
 * @property {string} witnessTwo
 */

/**
 * A registration held by the General Register Office. Registration happens
 * internally at GRO — citizens never create one of these; they look one up by
 * its registration number.
 * @typedef {Object} GroRegistration
 * @property {string} id
 * @property {string} regNo
 * @property {GroCertificateType} type
 * @property {GroRegistrationStatus} status
 * @property {string} registryDistrict
 * @property {string} registeredAt
 * @property {string|null} approvedAt
 * @property {string|null} rejectionReason
 * @property {string|null} claimNationalId  national ID entitled to claim it
 * @property {GroBirthRecord|GroDeathRecord|GroMarriageRecord} record
 */

/**
 * A certificate generated from an approved registration. Created on first
 * claim and reused thereafter, so the certificate number stays stable.
 * @typedef {Object} GroCertificate
 * @property {string} id
 * @property {string} registrationId
 * @property {string} regNo
 * @property {string} certNo
 * @property {GroCertificateType} type
 * @property {string} issuedAt
 * @property {GroDeliveryTier} tier
 * @property {{label: string, value: string}[]} payload  the printed field/value pairs
 */

/**
 * A citizen's request against a registration number — what makes the lookup
 * show up in My Applications and the tracker.
 * @typedef {Object} GroRequest
 * @property {string} id
 * @property {string} ref
 * @property {string} userId
 * @property {string} regNo
 * @property {string|null} registrationId
 * @property {GroCertificateType|null} type
 * @property {ApplicationStatus} status
 * @property {GroDeliveryTier} tier
 * @property {number} feeTotalGyd
 * @property {FeeStatus} feeStatus
 * @property {string|null} certificateId
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * A document in a citizen's Vault. Scoped by userId — only the owning
 * citizen ever reads these.
 * @typedef {Object} VaultDocument
 * @property {string} id
 * @property {string} userId
 * @property {string} kind
 * @property {string} title
 * @property {string} subtitle
 * @property {string} icon
 * @property {'citizen'|'government'} source
 * @property {string|null} issuedBy
 * @property {string|null} refNo
 * @property {string|null} fileName
 * @property {string|null} mimeType
 * @property {Blob|null} blob                 the file itself, for anything the citizen uploaded
 * @property {number|null} sizeBytes
 * @property {{generator: string, args: Record<string, unknown>}|null} content
 * @property {string} addedAt
 */

export {};
