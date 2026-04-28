from __future__ import annotations

from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from isdr_api.db_models_extended import ConsentDocument, Country, District, Language, Region, SpeechCondition


UGANDA_REGIONS = ["Central", "Eastern", "Northern", "Western"]

UGANDA_DISTRICTS_BY_REGION = {
    "Central": [
        "Buikwe",
        "Bukomansimbi",
        "Butebo",
        "Buvuma",
        "Gomba",
        "Kalangala",
        "Kalungu",
        "Kampala",
        "Kayunga",
        "Kiboga",
        "Kiruhura",
        "Kyankwanzi",
        "Kyotera",
        "Luwero",
        "Lwengo",
        "Lyantonde",
        "Masaka",
        "Mityana",
        "Mpigi",
        "Mubende",
        "Mukono",
        "Nakaseke",
        "Nakasongola",
        "Rakai",
        "Sembabule",
        "Wakiso",
    ],
    "Eastern": [
        "Amuria",
        "Budaka",
        "Bududa",
        "Bugiri",
        "Bugweri",
        "Bukedea",
        "Bukwo",
        "Bulambuli",
        "Busia",
        "Butebo",
        "Buyende",
        "Iganga",
        "Jinja",
        "Kaberamaido",
        "Kaliro",
        "Kamuli",
        "Kapchorwa",
        "Katakwi",
        "Kibuku",
        "Kumi",
        "Kween",
        "Luuka",
        "Manafwa",
        "Mayuge",
        "Mbale",
        "Namayingo",
        "Namisindwa",
        "Namutumba",
        "Ngora",
        "Pallisa",
        "Serere",
        "Sironko",
        "Soroti",
        "Tororo",
    ],
    "Northern": [
        "Abim",
        "Adjumani",
        "Agago",
        "Alebtong",
        "Amolatar",
        "Amudat",
        "Amuru",
        "Apac",
        "Arua",
        "Dokolo",
        "Gulu",
        "Kitgum",
        "Koboko",
        "Kole",
        "Kotido",
        "Kwania",
        "Lamwo",
        "Lira",
        "Maracha",
        "Moroto",
        "Moyo",
        "Nakapiripirit",
        "Nwoya",
        "Obongi",
        "Omoro",
        "Otuke",
        "Oyam",
        "Pader",
        "Pakwach",
        "Terego",
        "Yumbe",
        "Zombo",
    ],
    "Western": [
        "Buhweju",
        "Buliisa",
        "Bundibugyo",
        "Bushenyi",
        "Hoima",
        "Ibanda",
        "Isingiro",
        "Kabale",
        "Kabarole",
        "Kagadi",
        "Kakumiro",
        "Kamwenge",
        "Kanungu",
        "Kasese",
        "Katwe-Kabatoro",
        "Kibaale",
        "Kiryandongo",
        "Kisoro",
        "Kyegegwa",
        "Kyenjojo",
        "Masindi",
        "Mbarara",
        "Mitooma",
        "Ntoroko",
        "Ntungamo",
        "Rubanda",
        "Rubirizi",
        "Rukiga",
        "Rukungiri",
        "Rwampara",
        "Sheema",
    ],
}

UGANDA_LANGUAGES = [
    {"language_name": "Luganda", "iso_code": "lug", "is_low_resource": False, "speaker_count_approximate": 8_000_000},
    {"language_name": "Lusoga", "iso_code": "xog", "is_low_resource": False, "speaker_count_approximate": 3_000_000},
    {"language_name": "Runyankole", "iso_code": "nyn", "is_low_resource": False, "speaker_count_approximate": 3_000_000},
    {"language_name": "Rukiga", "iso_code": "cgg", "is_low_resource": True, "speaker_count_approximate": 2_000_000},
    {"language_name": "Runyoro", "iso_code": "nyo", "is_low_resource": True, "speaker_count_approximate": 1_000_000},
    {"language_name": "Rutooro", "iso_code": "ttj", "is_low_resource": True, "speaker_count_approximate": 1_000_000},
    {"language_name": "Lumasaba", "iso_code": "myx", "is_low_resource": True, "speaker_count_approximate": 1_000_000},
    {"language_name": "Lusamia", "iso_code": "lsm", "is_low_resource": True, "speaker_count_approximate": None},
    {"language_name": "Lugwere", "iso_code": "gwr", "is_low_resource": True, "speaker_count_approximate": None},
    {"language_name": "Lunyole", "iso_code": "nuj", "is_low_resource": True, "speaker_count_approximate": None},
    {"language_name": "Lusese", "iso_code": "lsse", "is_low_resource": True, "speaker_count_approximate": None},
    {"language_name": "Rukonjo", "iso_code": "koo", "is_low_resource": True, "speaker_count_approximate": None},
    {"language_name": "Rwamba", "iso_code": "rwm", "is_low_resource": True, "speaker_count_approximate": None},
    {"language_name": "Lubwisi", "iso_code": "tlj", "is_low_resource": True, "speaker_count_approximate": None},
    {"language_name": "Lugungu", "iso_code": "gug", "is_low_resource": True, "speaker_count_approximate": None},
    {"language_name": "Lunyala", "iso_code": "nle", "is_low_resource": True, "speaker_count_approximate": None},
    {"language_name": "English", "iso_code": "eng", "is_low_resource": False, "speaker_count_approximate": None},
    {"language_name": "Swahili", "iso_code": "swa", "is_low_resource": False, "speaker_count_approximate": None},
    {"language_name": "Nubi", "iso_code": "kcn", "is_low_resource": True, "speaker_count_approximate": None},
    {"language_name": "Acholi", "iso_code": "ach", "is_low_resource": True, "speaker_count_approximate": 1_700_000},
    {"language_name": "Lango", "iso_code": "laj", "is_low_resource": True, "speaker_count_approximate": 1_500_000},
    {"language_name": "Ateso / Teso", "iso_code": "teo", "is_low_resource": True, "speaker_count_approximate": 3_000_000},
    {"language_name": "Karamojong", "iso_code": "kdj", "is_low_resource": True, "speaker_count_approximate": 500_000},
    {"language_name": "Alur", "iso_code": "alz", "is_low_resource": True, "speaker_count_approximate": 500_000},
    {"language_name": "Adhola / Jopadhola", "iso_code": "adh", "is_low_resource": True, "speaker_count_approximate": None},
    {"language_name": "Kumam", "iso_code": "kdi", "is_low_resource": True, "speaker_count_approximate": None},
    {"language_name": "Kakwa", "iso_code": "keo", "is_low_resource": True, "speaker_count_approximate": None},
    {"language_name": "Lugbara", "iso_code": "lgg", "is_low_resource": True, "speaker_count_approximate": 2_000_000},
    {"language_name": "Madi", "iso_code": "mhi", "is_low_resource": True, "speaker_count_approximate": None},
    {"language_name": "Aringa", "iso_code": "ari", "is_low_resource": True, "speaker_count_approximate": None},
    {"language_name": "Kupsabiny", "iso_code": "kpz", "is_low_resource": True, "speaker_count_approximate": None},
    {"language_name": "Ik", "iso_code": "ikx", "is_low_resource": True, "speaker_count_approximate": None},
    {"language_name": "Soo / Tepeth", "iso_code": "sop", "is_low_resource": True, "speaker_count_approximate": None},
]

KENYA_LANGUAGES = [
    {"language_name": "Kikuyu", "iso_code": "kik", "is_low_resource": False, "speaker_count_approximate": None},
    {"language_name": "Luo / Dholuo", "iso_code": "luo", "is_low_resource": False, "speaker_count_approximate": None},
    {"language_name": "Luhya", "iso_code": "luy", "is_low_resource": False, "speaker_count_approximate": None},
    {"language_name": "Kamba", "iso_code": "kam", "is_low_resource": True, "speaker_count_approximate": None},
    {"language_name": "Kalenjin", "iso_code": "kln", "is_low_resource": False, "speaker_count_approximate": None},
    {"language_name": "Meru", "iso_code": "mer", "is_low_resource": True, "speaker_count_approximate": None},
    {"language_name": "Gusii", "iso_code": "guz", "is_low_resource": True, "speaker_count_approximate": None},
    {"language_name": "Mijikenda", "iso_code": "nyf", "is_low_resource": True, "speaker_count_approximate": None},
    {"language_name": "Somali", "iso_code": "som", "is_low_resource": False, "speaker_count_approximate": None},
    {"language_name": "Maasai", "iso_code": "mas", "is_low_resource": True, "speaker_count_approximate": None},
]

SPEECH_CONDITIONS = [
    {
        "condition_name": "Stuttering",
        "description": "Speech with repetitions, prolongations, or blocks.",
        "research_notes": "Common fluency condition for speaker profiling.",
    },
    {
        "condition_name": "Dysarthria",
        "description": "Speech affected by weakened or poorly coordinated muscles.",
        "research_notes": "Often impacts articulation and intelligibility.",
    },
    {
        "condition_name": "Aphasia",
        "description": "Language impairment that affects speech and comprehension.",
        "research_notes": "Useful for language-disorder research cohorts.",
    },
    {
        "condition_name": "Hearing Impairment",
        "description": "Speech influenced by reduced hearing ability.",
        "research_notes": "May affect pronunciation development and monitoring.",
    },
    {
        "condition_name": "Cleft Palate Speech",
        "description": "Speech differences associated with cleft palate or related resonance patterns.",
        "research_notes": "Relevant for resonance and articulation analysis.",
    },
    {
        "condition_name": "Voice Disorders",
        "description": "Differences in pitch, loudness, or vocal quality.",
        "research_notes": "May affect phonation stability.",
    },
    {
        "condition_name": "Apraxia of Speech",
        "description": "Difficulty planning and sequencing speech movements.",
        "research_notes": "Useful for motor-speech research cohorts.",
    },
    {
        "condition_name": "Selective Mutism",
        "description": "Consistent inability to speak in some settings despite speaking in others.",
        "research_notes": "Important for participation and communication context.",
    },
    {
        "condition_name": "Autism Spectrum (speech differences)",
        "description": "Speech and communication differences associated with autism spectrum conditions.",
        "research_notes": "Use for pragmatic and prosodic speech variation.",
    },
    {
        "condition_name": "None / Typical Speech",
        "description": "No known speech condition or speech difference reported.",
        "research_notes": "Default option for participants without a speech condition.",
    },
    {
        "condition_name": "stutter",
        "description": "Speech with repetitions, prolongations, or blocks.",
        "research_notes": "Legacy seed entry retained for compatibility.",
    },
    {
        "condition_name": "dysarthria",
        "description": "Speech affected by weakened or poorly coordinated muscles.",
        "research_notes": "Legacy seed entry retained for compatibility.",
    },
    {
        "condition_name": "apraxia",
        "description": "Difficulty planning and sequencing speech movements.",
        "research_notes": "Legacy seed entry retained for compatibility.",
    },
    {
        "condition_name": "voice_disorder",
        "description": "Differences in pitch, loudness, or vocal quality.",
        "research_notes": "Legacy seed entry retained for compatibility.",
    },
    {
        "condition_name": "other",
        "description": "A speech-related condition not listed separately.",
        "research_notes": "Legacy seed entry retained for compatibility.",
    },
]


def _new_id() -> str:
    return str(uuid4())


def _ensure_country(db: Session, *, country_name: str, iso_code: str, region: str) -> Country:
    country = db.execute(select(Country).where(func.lower(Country.iso_code) == iso_code.lower())).scalar_one_or_none()
    if country is None:
        country = Country(id=_new_id(), country_name=country_name, iso_code=iso_code, region=region)
        db.add(country)
        db.flush()
        return country

    country.country_name = country_name
    country.iso_code = iso_code
    country.region = region
    return country


def _ensure_region(db: Session, *, country_id: str, region_name: str) -> Region:
    region = db.execute(select(Region).where(Region.country_id == country_id, Region.region_name == region_name)).scalar_one_or_none()
    if region is None:
        region = Region(id=_new_id(), country_id=country_id, region_name=region_name)
        db.add(region)
        db.flush()
        return region

    region.country_id = country_id
    region.region_name = region_name
    return region


def _ensure_district(db: Session, *, country_id: str, region_id: str, district_name: str) -> None:
    district = db.execute(select(District).where(District.country_id == country_id, District.district_name == district_name)).scalar_one_or_none()
    if district is None:
        db.add(District(id=_new_id(), country_id=country_id, region_id=region_id, district_name=district_name))
        return

    district.country_id = country_id
    district.region_id = region_id
    district.district_name = district_name


def _ensure_language(db: Session, *, country_id: str, language_spec: dict[str, object]) -> None:
    iso_code = str(language_spec["iso_code"])
    language = db.execute(select(Language).where(func.lower(Language.iso_code) == iso_code.lower())).scalar_one_or_none()
    if language is None:
        db.add(
            Language(
                id=_new_id(),
                language_name=str(language_spec["language_name"]),
                iso_code=iso_code,
                country_id=country_id,
                is_low_resource=bool(language_spec["is_low_resource"]),
                speaker_count_approximate=language_spec.get("speaker_count_approximate"),
            )
        )
        db.flush()
        return

    language.language_name = str(language_spec["language_name"])
    language.iso_code = iso_code
    language.country_id = country_id
    language.is_low_resource = bool(language_spec["is_low_resource"])
    language.speaker_count_approximate = language_spec.get("speaker_count_approximate")


def _ensure_consent_document(db: Session, document_type: str, values: dict[str, str]) -> None:
    document = db.execute(select(ConsentDocument).where(ConsentDocument.document_type == document_type)).scalar_one_or_none()
    if document is None:
        db.add(
            ConsentDocument(
                id=_new_id(),
                title=values["title"],
                document_type=document_type,
                version=values["version"],
                document_url=values["document_url"],
                is_active=True,
            )
        )
        return

    document.title = values["title"]
    document.version = values["version"]
    document.document_url = values["document_url"]
    document.is_active = True


def _ensure_speech_condition(db: Session, condition_spec: dict[str, str]) -> None:
    condition = db.execute(select(SpeechCondition).where(SpeechCondition.condition_name == condition_spec["condition_name"])).scalar_one_or_none()
    if condition is None:
        db.add(
            SpeechCondition(
                id=_new_id(),
                condition_name=condition_spec["condition_name"],
                description=condition_spec["description"],
                research_notes=condition_spec["research_notes"],
            )
        )
        return

    condition.description = condition_spec["description"]
    condition.research_notes = condition_spec["research_notes"]


def seed_reference_data(db: Session) -> None:
    print("Seeding countries...")
    uganda = _ensure_country(db, country_name="Uganda", iso_code="UG", region="East Africa")
    kenya = _ensure_country(db, country_name="Kenya", iso_code="KE", region="East Africa")
    print("  Uganda and Kenya ensured")

    print("Seeding Uganda regions...")
    regions: dict[str, Region] = {}
    for region_name in UGANDA_REGIONS:
        regions[region_name] = _ensure_region(db, country_id=uganda.id, region_name=region_name)
    print(f"  Uganda regions ensured: {len(regions)}")

    print("Seeding Uganda districts...")
    district_count = 0
    for region_name, district_names in UGANDA_DISTRICTS_BY_REGION.items():
        region = regions[region_name]
        for district_name in district_names:
            _ensure_district(db, country_id=uganda.id, region_id=region.id, district_name=district_name)
            district_count += 1
    print(f"  Uganda districts ensured: {district_count}")

    print("Seeding languages...")
    for language_spec in UGANDA_LANGUAGES:
        _ensure_language(db, country_id=uganda.id, language_spec=language_spec)
    for language_spec in KENYA_LANGUAGES:
        _ensure_language(db, country_id=kenya.id, language_spec=language_spec)
    print(f"  Uganda languages ensured: {len(UGANDA_LANGUAGES)}")
    print(f"  Kenya languages ensured: {len(KENYA_LANGUAGES)}")
    # Kenya districts are not seeded — users input their district manually

    print("Seeding consent documents...")
    required_consents = {
        "privacy_policy": {
            "title": "ISDR Privacy Policy",
            "version": "v1.0",
            "document_url": "/privacy-policy",
        },
        "research_consent": {
            "title": "ISDR Research Consent",
            "version": "v1.0",
            "document_url": "/research-consent",
        },
    }
    for document_type, values in required_consents.items():
        _ensure_consent_document(db, document_type, values)
    print(f"  Consent documents ensured: {len(required_consents)}")

    print("Seeding speech conditions...")
    for condition_spec in SPEECH_CONDITIONS:
        _ensure_speech_condition(db, condition_spec)
    print(f"  Speech conditions ensured: {len(SPEECH_CONDITIONS)}")

    db.commit()
    print("Reference data seed complete")
