from __future__ import annotations

from sqlalchemy.orm import Session

from isdr_api.db_models_extended import ConsentDocument, Country, District, Language, SpeechCondition


def seed_reference_data(db: Session) -> None:
    uganda = db.query(Country).filter(Country.iso_code == "UG").first()
    if uganda is None:
        uganda = Country(country_name="Uganda", iso_code="UG", region="Africa")
        db.add(uganda)
        db.flush()

    existing_districts = db.query(District).filter(District.country_id == uganda.id).count()
    if existing_districts == 0:
        uganda_districts = [
            "Abim", "Adjumani", "Agago", "Alebtong", "Amolatar", "Amudat", "Amuria", "Arua",
            "Budaka", "Buddu", "Bugiri", "Buhweju", "Bukomansimbi", "Bukwa", "Buliisa", "Bundibugyo",
            "Bunyangabu", "Bushenyi", "Busia", "Butaleja", "Butambala", "Butanderega", "Butansimbi",
            "Butiaba", "Buyende", "Cheptegei", "Dokolo", "Entebbe", "Gulu", "Hoima", "Ibanda",
            "Isingiro", "Jinja", "Kabale", "Kabarole", "Kaberamaido", "Kabira", "Kabirdibwa", "Kabirini",
            "Kabisibwa", "Kabole", "Kabowa", "Kabudde", "Kabuguzo", "Kabuku", "Kabugwe", "Kabugyeya",
            "Kabugu", "Kabuja", "Kabuka", "Kabukale", "Kabula", "Kabulasoke", "Kabule", "Kabuleganya",
            "Kabuli", "Kabulo", "Kabulwamala", "Kabuma", "Kabumare", "Kabumbi", "Kabumire",
        ]

        for district_name in uganda_districts:
            db.add(District(country_id=uganda.id, district_name=district_name))
        db.flush()

    languages = [
        {"language_name": "Luganda", "iso_code": "LG", "is_low_resource": True},
        {"language_name": "English", "iso_code": "ENG", "is_low_resource": False},
        {"language_name": "Swahili", "iso_code": "SWA", "is_low_resource": False},
        {"language_name": "Lusoga", "iso_code": "LSG", "is_low_resource": True},
        {"language_name": "Lumasaba", "iso_code": "LMS", "is_low_resource": True},
        {"language_name": "Acholi", "iso_code": "ACH", "is_low_resource": True},
        {"language_name": "Runyakore", "iso_code": "RUN", "is_low_resource": True},
        {"language_name": "Ateso", "iso_code": "ATE", "is_low_resource": True},
        {"language_name": "Lugbara", "iso_code": "LUG", "is_low_resource": True},
    ]

    existing_languages = {
        language.iso_code: language
        for language in db.query(Language).filter(Language.country_id == uganda.id).all()
    }

    for language_spec in languages:
        existing_language = existing_languages.get(language_spec["iso_code"])
        if existing_language:
            existing_language.language_name = language_spec["language_name"]
            existing_language.is_low_resource = language_spec["is_low_resource"]
            existing_language.country_id = uganda.id
        else:
            db.add(
                Language(
                    language_name=language_spec["language_name"],
                    iso_code=language_spec["iso_code"],
                    country_id=uganda.id,
                    is_low_resource=language_spec["is_low_resource"],
                )
            )

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
        existing = (
            db.query(ConsentDocument)
            .filter(ConsentDocument.document_type == document_type)
            .first()
        )
        if existing:
            existing.title = values["title"]
            existing.version = values["version"]
            existing.document_url = values["document_url"]
            existing.is_active = True
        else:
            db.add(
                ConsentDocument(
                    title=values["title"],
                    document_type=document_type,
                    version=values["version"],
                    document_url=values["document_url"],
                    is_active=True,
                )
            )

    existing_speech_conditions = db.query(SpeechCondition).count()
    if existing_speech_conditions == 0:
        db.add_all(
            [
                SpeechCondition(
                    condition_name="stutter",
                    description="Speech with repetitions, prolongations, or blocks.",
                    research_notes="Common fluency condition for speaker profiling.",
                ),
                SpeechCondition(
                    condition_name="dysarthria",
                    description="Speech affected by weakened or poorly coordinated muscles.",
                    research_notes="Often impacts articulation and intelligibility.",
                ),
                SpeechCondition(
                    condition_name="apraxia",
                    description="Difficulty planning and sequencing speech movements.",
                    research_notes="Useful for motor-speech research cohorts.",
                ),
                SpeechCondition(
                    condition_name="voice_disorder",
                    description="Differences in pitch, loudness, or vocal quality.",
                    research_notes="May affect phonation stability.",
                ),
                SpeechCondition(
                    condition_name="other",
                    description="A speech-related condition not listed separately.",
                    research_notes="Use when a participant needs a catch-all option.",
                ),
            ]
        )

    db.commit()
