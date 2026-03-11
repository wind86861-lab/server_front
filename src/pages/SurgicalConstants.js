export const EMPTY_SURGICAL_FORM = {
    // STEP 1: Basic Info
    nameUz: '', nameRu: '', nameEn: '',
    categoryId: '',
    parentCatId: '', // For UI selection
    shortDescription: '',
    fullDescription: '',
    imageUrl: '',

    // STEP 2: Pricing & Time
    priceRecommended: 0,
    priceMin: 0,
    priceMax: 0,
    durationMinutes: 60,
    minDuration: 30,
    maxDuration: 120,
    recoveryDays: 7,

    // STEP 3: Anesthesia & Hospitalization
    anesthesiaType: 'GENERAL',
    anesthesiaNotes: '',
    requiresHospitalization: true,
    hospitalizationDays: 3,
    roomType: 'STANDARD',
    requiresICU: false,
    icuDays: 0,
    hospitalizationNotes: '',

    // STEP 4: Pre-operation
    requiredTests: [], // Array of strings
    preparationFasting: true,
    fastingHours: 12,
    preparationMedication: '',
    preparationRestrictions: [],
    preparationTimeline: '',
    contraindicationsAbsolute: [],
    contraindicationsRelative: [],

    // STEP 5: Operation Details
    complexity: 'MEDIUM',
    riskLevel: 'MEDIUM',
    minSurgeonExperience: 5,
    surgeonQualifications: [],
    surgeonSpecialization: '',
    requiredEquipment: [],
    operationStages: [],

    // STEP 6: Post-operation
    postOpImmediate: { monitoring: '', meds: '', restrictions: '' },
    postOpHome: { care: '', signs: '', meds: '' },
    followUpSchedule: [], // Array of { time: '', tasks: '' }
    recoveryMilestones: [],

    // STEP 7: Package Contents
    packageIncluded: [], // Array of { item: '', desc: '' }
    packageExcluded: [], // Array of { item: '', extraPrice: 0 }

    // STEP 8: Review & Publish
    alternatives: [],
    faqs: [],
    successRate: 95,
    videoUrl: '',
    isActive: true,
};

export const SURGICAL_STEPS = [
    { title: 'Asosiy ma\'lumotlar', desc: 'Nomi, kategoriya va tavsif' },
    { title: 'Narx va vaqt', desc: 'Xarajatlar va operatsiya davomiyligi' },
    { title: 'Anesteziya va shifoxona', desc: 'Anesteziya turi va yotib davolanish' },
    { title: 'Tayyorgarlik', desc: 'Tahlillar va cheklovlar' },
    { title: 'Operatsiya tafsilotlari', desc: 'Murakkablik va mutaxassislar' },
    { title: 'Operatsiyadan keyin', desc: 'Parvarish va kuzatuv' },
    { title: 'Paket tarkibi', desc: 'Nimalar kiritilgan' },
    { title: 'Tekshirish', desc: 'Yakuniy ko\'rib chiqish' }
];
