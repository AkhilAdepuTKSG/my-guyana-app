// Shared domain types for the My Guyana data layer.
//
// The app has no server, so these JSDoc typedefs are the contract that the
// stores (src/data), the endpoints (src/api) and the screens all agree on.
// Editors type-check against them and `npm run build` keeps the JS honest;
// treat a change here as a change every layer must follow (models, seed,
// endpoints, validation, UI).

/** @typedef {'cashGrants'|'singleWindow'|'gro'|'gra'|'immigration'|'mhsss'} ServiceGroup */

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
 * @property {string[]} [accepts]  DOCUMENT_TYPES ids this slot will take from the
 *                                 Vault. A slot with no list accepts nothing from
 *                                 the Vault; see src/data/documentTypes.js.
 * @property {'vault'|'upload'} [source]
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
 * @property {AppointmentDef} [appointment]  an in-person visit the application books;
 *                                 the apply engine renders a step for it and the
 *                                 booking lands in the citizen's Schedule
 * @property {Record<string, number|string>} [config]  resolved service_config values,
 *                                 merged on read by src/api/catalog.js so a screen or
 *                                 an endpoint reads a threshold without a second call
 * @property {ServiceConfig[]} [configRows]  the same values with their labels and
 *                                 notes, for the screens that display them
 */

/**
 * An in-person visit a service requires — a Passport Office appointment, say.
 *
 * Some services cannot be finished online: a photograph, a signature and
 * fingerprints are captured across a counter, and the originals of what was
 * connected from the Vault are checked there. A service that says so here gets
 * a booking step in the apply engine, and the slot the citizen picks becomes a
 * real appointment in their Schedule.
 * @typedef {Object} AppointmentDef
 * @property {string} [title]   the step's heading
 * @property {string} label     what the citizen is being asked to do
 * @property {string} note      why the visit is needed, and what to bring
 */

/**
 * One configured value for a service — a benefit amount, a qualifying age, an
 * apply window, a processing time.
 *
 * These are the numbers a ministry changes by circular rather than by rewriting
 * its forms, so they are rows in `service_config` and never constants in the
 * code. `valueType` is what lets a screen render one without knowing what the
 * key means; `showOnView` is what puts it on the service's overview.
 * @typedef {Object} ServiceConfig
 * @property {string} id
 * @property {string} serviceId
 * @property {string} key                what the endpoints look it up by
 * @property {string} label              what a citizen sees
 * @property {'money'|'number'|'years'|'weeks'|'days'|'text'} valueType
 * @property {number|string} value
 * @property {string} [unit]             'month' | 'year' — what the amount is per
 * @property {string} [note]
 * @property {string} [effectiveFrom]    ISO date the value took effect
 * @property {boolean} [showOnView]      surfaced on the service's overview screen
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
 * An old age pension application (MHSSS).
 *
 * `dateOfBirth` and `ageAtApplication` are stored on the row rather than left
 * in `fields`: the age test is the whole basis of the award, so what was
 * checked has to survive on the application itself.
 * @typedef {ApplicationBase & {
 *   dateOfBirth: string|null,
 *   ageAtApplication: number|null,
 *   citizenship: string|null,
 *   yearsInGuyana: number|null,
 *   activeResidentYears: number|null,
 *   firstTimeApplicant: boolean,
 *   disbursementMethod: 'bank'|'mmg'|null,
 *   disbursementDetail: {provider: string|null, branch: string|null, last4: string|null, holder: string|null}|null,
 *   monthlyBenefitGyd: number|null,
 *   transportGrantGyd: number|null,
 *   awardStartsOn: string|null,
 *   awardDocumentId: string|null
 * }} OldAgePensionApplication
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
 * @property {string} type        a DOCUMENT_TYPES id — the single source of truth
 * @property {string} [section]   derived from the type: 'cards' | 'records'
 * @property {string} [typeLabel] derived from the type
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
