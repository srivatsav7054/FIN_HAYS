"""RAG implementation using ChromaDB and local SentenceTransformers."""

from __future__ import annotations

import json
import logging
from pathlib import Path

import chromadb
from chromadb.utils import embedding_functions

logger = logging.getLogger(__name__)

# Directory to store ChromaDB data locally
CHROMA_DATA_PATH = Path("./chroma_data").resolve()

# Embedding model: intfloat/multilingual-e5-base (multilingual, good for hi/te/mr/en)
# E5 requires "query: " or "passage: " prefix, but the default sentence-transformers
# pipeline handles it decently without, or we can just use it directly. For this
# hackathon, default encoding is fine.
MODEL_NAME = "intfloat/multilingual-e5-base"

_chroma_client = None
_collection = None
_embedding_function = None


def get_chroma_client():
    """Lazy initialize ChromaDB client and collection."""
    global _chroma_client, _collection, _embedding_function
    if _chroma_client is None:
        logger.info("Initializing ChromaDB at %s", CHROMA_DATA_PATH)
        _chroma_client = chromadb.PersistentClient(path=str(CHROMA_DATA_PATH))
        
        logger.info("Loading embedding model: %s", MODEL_NAME)
        # Device is automatically selected by sentence_transformers (CPU in this case)
        _embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=MODEL_NAME
        )
        
        _collection = _chroma_client.get_or_create_collection(
            name="financial_literacy",
            embedding_function=_embedding_function,
        )
        logger.info("ChromaDB and model initialized successfully.")
    return _collection


def seed_database():
    """Seed the database with comprehensive financial literacy content across EN, HI, TE, MR."""
    collection = get_chroma_client()

    if collection.count() >= 32:
        logger.info("ChromaDB already contains %d documents, skipping re-embedding.", collection.count())
        return

    logger.info("Seeding / updating database with comprehensive multilingual financial content...")
    
    docs = [
        # ── 1. Bank Accounts & PMJDY ─────────────────────────────────────────
        {
            "id": "doc_en_pmjdy",
            "text": "Pradhan Mantri Jan Dhan Yojana (PMJDY) offers a zero-balance savings bank account for every household. No minimum balance is required. Account holders receive a free RuPay debit card with built-in Rs 2 lakh accident insurance. To open an account, visit any bank branch or Bank Mitra with just an Aadhaar card and one passport photo.",
            "source": "pmjdy_account_en.md"
        },
        {
            "id": "doc_hi_pmjdy",
            "text": "प्रधानमंत्री जन धन योजना (PMJDY) के तहत किसी भी बैंक में शून्य बैलेंस खाता खोला जा सकता है। इसमें कोई न्यूनतम पैसा रखने की मजबूरी नहीं है। खाते के साथ रूपे (RuPay) डेबिट कार्ड और 2 लाख रुपये का मुफ्त दुर्घटना बीमा मिलता है। खाता खोलने के लिए सिर्फ आधार कार्ड और एक फोटो लेकर नजदीकी बैंक या बैंक मित्र के पास जाएं।",
            "source": "pmjdy_account_hi.md"
        },
        {
            "id": "doc_te_pmjdy",
            "text": "ప్రధాన మంత్రి జన్ ధన్ యోజన (PMJDY) ద్వారా జీరో బ్యాలెన్స్ బ్యాంకు ఖాతా తెరవవచ్చు. కనీస నగదు నిల్వ ఉంచాల్సిన అవసరం లేదు. దీనితో ఉచిత రూపే డెబిట్ కార్డు మరియు 2 లక్షల రూపాయల ప్రమాద బీమా లభిస్తాయి. ఖాతా తెరవడానికి ఆధార్ కార్డు మరియు ఒక ఫోటోతో సమీపంలోని బ్యాంకు లేదా బ్యాంక్ మిత్ర వద్దకు వెళ్లండి.",
            "source": "pmjdy_account_te.md"
        },
        {
            "id": "doc_mr_pmjdy",
            "text": "प्रधानमंत्री जन धन योजनेअंतर्गत (PMJDY) कोणत्याही बँकेत शून्य शिल्लक (झिरो बॅलन्स) खाते उघडता येते. कोणतेही किमान पैसे ठेवण्याची गरज नाही. यात मोफत रुपे (RuPay) डेबिट कार्ड आणि 2 लाख रुपयांचा अपघात विमा मिळतो. खाते उघडण्यासाठी फक्त आधार कार्ड आणि एक फोटो घेऊन जवळच्या बँकेत किंवा बँक मित्राकडे जा.",
            "source": "pmjdy_account_mr.md"
        },

        # ── 2. Fixed Deposits (FD) & Recurring Deposits (RD) ────────────────
        {
            "id": "doc_en_fdrd",
            "text": "Fixed Deposit (FD) lets you deposit a lump sum for a fixed period (such as 1 to 5 years) to earn guaranteed interest higher than a regular savings account. Recurring Deposit (RD) lets you save a fixed small amount every month (e.g., 500 rupees per month). Both FDs and RDs in authorized banks or post offices are completely safe and secure.",
            "source": "fixed_recurring_deposit_en.md"
        },
        {
            "id": "doc_hi_fdrd",
            "text": "सावधि जमा (FD / फिक्स्ड डिपॉजिट) में आप एकमुश्त रकम तय समय (जैसे 1 से 5 साल) के लिए जमा करते हैं, जिस पर सामान्य बचत खाते से ज्यादा और पक्का ब्याज मिलता है। आवर्ती जमा (RD / रेकरिंग डिपॉजिट) में आप हर महीने तय छोटी रकम (जैसे 500 रुपये महीना) जमा कर सकते हैं। बैंक या डाकघर में FD और RD का पैसा पूरी तरह सुरक्षित रहता है।",
            "source": "fixed_recurring_deposit_hi.md"
        },
        {
            "id": "doc_te_fdrd",
            "text": "ఫిక్స్‌డ్ డిపాజిట్ (FD) ద్వారా నిర్దిష్ట కాలానికి (1 నుండి 5 సంవత్సరాలు) ఒకేసారి డబ్బు జమ చేసి సాధారణ సేవింగ్స్ ఖాతా కంటే ఎక్కువ మరియు స్థిరమైన వడ్డీ పొందవచ్చు. రికరింగ్ డిపాజిట్ (RD) ద్వారా ప్రతి నెలా కొంత స్థిర మొత్తం (ఉదాహరణకు నెలకు 500 రూపాయలు) పొదుపు చేయవచ్చు. బ్యాంకు లేదా పోస్ట్ ఆఫీసులలో FD మరియు RD పూర్తి సురక్షితం.",
            "source": "fixed_recurring_deposit_te.md"
        },
        {
            "id": "doc_mr_fdrd",
            "text": "मुदत ठेव (FD / फिक्स डिपॉझिट) मध्ये तुम्ही ठराविक काळासाठी (1 ते 5 वर्षे) एकरकमी पैसे ठेवून बचत खात्यापेक्षा जास्त आणि खात्रीशीर व्याज मिळवू शकता. आवर्ती ठेव (RD / रेकरिंग डिपॉझिट) मध्ये तुम्ही दरमहा छोटी रक्कम (उदा. दरमहा 500 रुपये) जमा करू शकता. बँक किंवा पोस्टातील FD आणि RD चे पैसे पूर्णपणे सुरक्षित असतात.",
            "source": "fixed_recurring_deposit_mr.md"
        },

        # ── 3. Loans & Safe Borrowing vs Moneylenders ─────────────────────────
        {
            "id": "doc_en_loans",
            "text": "Borrowing from local moneylenders or informal lenders carries dangerously high interest rates that can trap families in lifelong debt. Always prefer bank loans, Self-Help Group (SHG) loans, or Mudra loans for small businesses. Farmers can get low-interest crop loans up to 3 lakh rupees using the Kisan Credit Card (KCC). Bank loans have fixed transparent rules.",
            "source": "loans_and_credit_safety_en.md"
        },
        {
            "id": "doc_hi_loans",
            "text": "साहूकारों या गैर-सरकारी व्यक्तियों से कर्ज लेने पर भारी ब्याज लगता है जिससे परिवार कर्ज के जाल में फंस जाता है। हमेशा बैंक, स्वयं सहायता समूह (SHG) या मुद्रा योजना से ही कर्ज लें। किसानों के लिए किसान क्रेडिट कार्ड (KCC) पर 3 लाख तक का सस्ता फसली ऋण मिलता है। बैंकों के नियम पारदर्शी और ब्याज की दरें सरकारी होती हैं।",
            "source": "loans_and_credit_safety_hi.md"
        },
        {
            "id": "doc_te_loans",
            "text": "వడ్డీ వ్యాపారుల వద్ద అధిక వడ్డీకి రుణాలు తీసుకోవడం వల్ల అప్పుల ఊబిలో చిక్కుకుంటారు. ఎల్లప్పుడూ బ్యాంకులు, స్వయం సహాయక సంఘాలు (SHG) లేదా ముద్ర యోజన ద్వారా మాత్రమే రుణం తీసుకోండి. రైతులకు కిసాన్ క్రెడిట్ కార్డు (KCC) ద్వారా తక్కువ వడ్డీకే 3 లక్షల వరకు పంట రుణం లభిస్తుంది. బ్యాంకుల నియమాలు స్పష్టంగా మరియు సురక్షితంగా ఉంటాయి.",
            "source": "loans_and_credit_safety_te.md"
        },
        {
            "id": "doc_mr_loans",
            "text": "सावकारांकडून किंवा खाजगी लोकांकडून कर्ज घेतल्यास भरमसाठ व्याज द्यावे लागते आणि कुटुंब कर्जाच्या विळख्यात अडकते. नेहमी बँक, बचत गट (SHG) किंवा मुद्रा योजनेतूनच कर्ज घ्या. शेतकऱ्यांना किसान क्रेडिट कार्डवर (KCC) 3 लाखांपर्यंत कमी व्याजात पीक कर्ज मिळते. बँकेचे नियम पारदर्शक आणि व्याजदर माफक असतात.",
            "source": "loans_and_credit_safety_mr.md"
        },

        # ── 4. Digital Banking, ATM & UPI Fraud Prevention ──────────────────
        {
            "id": "doc_en_digital",
            "text": "You can withdraw cash anytime using an ATM card and make easy digital payments using UPI on mobile. IMPORTANT SECURITY RULE: Never share your ATM 4-digit PIN, UPI secret PIN, or OTP with anyone, not even someone claiming to be a bank manager. Banks never call asking for your OTP or password.",
            "source": "digital_banking_security_en.md"
        },
        {
            "id": "doc_hi_digital",
            "text": "एटीएम (ATM) कार्ड से आप कभी भी नकदी निकाल सकते हैं और यूपीआई (UPI) से मोबाइल द्वारा सुरक्षित भुगतान कर सकते हैं। सबसे जरूरी सुरक्षा नियम: अपना 4 अंकों का एटीएम पिन, यूपीआई पिन या ओटीपी (OTP) किसी को न बताएं, चाहे फोन करने वाला खुद को बैंक मैनेजर ही क्यों न कहे। बैंक कभी भी फोन पर पिन या ओटीपी नहीं मांगते।",
            "source": "digital_banking_security_hi.md"
        },
        {
            "id": "doc_te_digital",
            "text": "ATM కార్డుతో ఎప్పుడైనా నగదు విత్‌డ్రా చేసుకోవచ్చు మరియు UPI ద్వారా మొబైల్ నుంచి సులభంగా చెల్లింపులు చేయవచ్చు. అతి ముఖ్యమైన భద్రతా నియమం: మీ 4 అంకెల ATM పిన్, UPI పిన్ లేదా OTP ని ఎవరితోనూ పంచుకోవద్దు. బ్యాంకు మేనేజర్ అని చెప్పినా కూడా OTP చెప్పకూడదు. బ్యాంకులు ఎప్పుడూ ఫోన్‌లో పిన్ లేదా OTP అడగవు.",
            "source": "digital_banking_security_te.md"
        },
        {
            "id": "doc_mr_digital",
            "text": "एटीएम (ATM) कार्डने तुम्ही कधीही पैसे काढू शकता आणि यूपीआय (UPI) द्वारे मोबाईलवरून पैसे पाठवू शकता. अत्यंत महत्त्वाचा नियम: तुमचा 4 अंकी एटीएम पिन, यूपीआय पिन किंवा ओटीपी (OTP) कोणालाही सांगू नका, फोन करणारा व्यक्ती स्वतःला बँक मॅनेजर म्हणत असला तरीही. बँक कधीही फोनवर ओटीपी किंवा पिन मागत नाही.",
            "source": "digital_banking_security_mr.md"
        },

        # ── 5. Sukanya Samriddhi Yojana (SSY) ─────────────────────────────────
        {
            "id": "doc_en_ssy",
            "text": "Sukanya Samriddhi Yojana (SSY) is a government savings scheme for girl children below 10 years of age. It offers one of the highest government-backed interest rates, and the returns are completely tax-free. You can open an SSY account at any post office or commercial bank with as little as 250 rupees initial deposit.",
            "source": "sukanya_samriddhi_en.md"
        },
        {
            "id": "doc_hi_ssy",
            "text": "सुकन्या समृद्धि योजना (SSY) 10 वर्ष से कम उम्र की बेटियों के लिए सरकार की खास बचत योजना है। इसमें सरकार सबसे अधिक और कर-मुक्त ब्याज देती है। यह खाता किसी भी डाकघर या बैंक में सिर्फ 250 रुपये जमा करके खोला जा सकता है। यह पैसे बेटी की पढ़ाई और भविष्य के काम आते हैं।",
            "source": "sukanya_samriddhi_hi.md"
        },
        {
            "id": "doc_te_ssy",
            "text": "సుకున్య సమృద్ధి యోజన (SSY) అనేది 10 సంవత్సరాల లోపు ఆడపిల్లల కోసం ప్రభుత్వం అందించే ప్రత్యేక పొదుపు పథకం. దీనిపై ప్రభుత్వ అత్యధిక వడ్డీ లభిస్తుంది. కేవలం 250 రూపాయలతో పోస్ట్ ఆఫీస్ లేదా బ్యాంకులో ఈ ఖాతా తెరవవచ్చు. ఇది ఆడపిల్లల చదువుకు మరియు భవిష్యత్తుకు ఎంతగానో ఉపయోగపడుతుంది.",
            "source": "sukanya_samriddhi_te.md"
        },
        {
            "id": "doc_mr_ssy",
            "text": "सुकन्या समृद्धी योजना (SSY) ही 10 वर्षांखालील मुलींसाठी सरकारची विशेष बचत योजना आहे. यावर सरकारकडून सर्वाधिक आणि करमुक्त व्याज दिले जाते. हे खाते कोणत्याही पोस्ट ऑफिस किंवा बँकेत अवघ्या 250 रुपयांत उघडता येते. हे पैसे मुलीच्या शिक्षणासाठी व भविष्यासाठी अत्यंत उपयुक्त ठरतात.",
            "source": "sukanya_samriddhi_mr.md"
        },

        # ── 6. Atal Pension Yojana (APY) ─────────────────────────────────────
        {
            "id": "doc_en_apy",
            "text": "Atal Pension Yojana (APY) is a government pension scheme for citizens between 18 and 40 years of age, especially in the unorganized sector. By saving a small fixed amount every month until age 60, you get a guaranteed monthly pension of 1,000 to 5,000 rupees for life after turning 60.",
            "source": "atal_pension_yojana_en.md"
        },
        {
            "id": "doc_hi_apy",
            "text": "अटल पेंशन योजना (APY) 18 से 40 वर्ष की आयु के नागरिकों के लिए सरकारी पेंशन योजना है। इसमें 60 वर्ष की उम्र तक हर महीने छोटी तय रकम जमा करने पर, 60 साल के बाद जीवनभर हर महीने 1,000 से 5,000 रुपये की पक्की मासिक पेंशन मिलती है।",
            "source": "atal_pension_yojana_hi.md"
        },
        {
            "id": "doc_te_apy",
            "text": "అటల్ పెన్షన్ యోజన (APY) 18 నుండి 40 సంవత్సరాల వయస్సు గల పౌరుల కోసం ప్రభుత్వం తెచ్చిన పెన్షన్ పథకం. 60 ఏళ్లు వచ్చే వరకు ప్రతి నెలా కొంత మొత్తం పొదుపు చేస్తే, 60 ఏళ్ల తర్వాత జీవితాంతం నెలకు 1,000 నుండి 5,000 రూపాయల స్థిర పెన్షన్ లభిస్తుంది.",
            "source": "atal_pension_yojana_te.md"
        },
        {
            "id": "doc_mr_apy",
            "text": "अटल पेन्शन योजना (APY) 18 ते 40 वर्षे वयोगटातील लोकांसाठी सरकारी पेन्शन योजना आहे. वयाच्या 60 वर्षांपर्यंत दरमहा छोटी रक्कम जमा केल्यास, वयाच्या साठीनंतर आयुष्यभर दरमहा 1,000 ते 5,000 रुपयांची हमीशीर मासिक पेन्शन मिळते.",
            "source": "atal_pension_yojana_mr.md"
        },

        # ── 7. Social Security Insurance (PMJJBY & PMSBY) ──────────────────────
        {
            "id": "doc_en_insurance",
            "text": "Pradhan Mantri Suraksha Bima Yojana (PMSBY) provides 2 lakh rupees accidental death insurance for just 20 rupees per year. Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY) provides 2 lakh rupees life insurance for any cause of death for 436 rupees per year. Any bank account holder can join through their branch.",
            "source": "insurance_schemes_en.md"
        },
        {
            "id": "doc_hi_insurance",
            "text": "प्रधानमंत्री सुरक्षा बीमा योजना (PMSBY) में मात्र 20 रुपये सालाना में 2 लाख रुपये का दुर्घटना बीमा मिलता है। प्रधानमंत्री जीवन ज्योति बीमा योजना (PMJJBY) में 436 रुपये सालाना में 2 लाख रुपये का जीवन बीमा मिलता है। किसी भी बैंक खाते से यह दोनों बीमा आसानी से जुड़े जा सकते हैं।",
            "source": "insurance_schemes_hi.md"
        },
        {
            "id": "doc_te_insurance",
            "text": "ప్రధాన మంత్రి సురక్ష బీమా యోజన (PMSBY) కింద ఏడాదికి కేవలం 20 రూపాయలతో 2 లక్షల రూపాయల ప్రమాద బీమా లభిస్తుంది. ప్రధాన మంత్రి జీవన్ జ్యోతి బీమా యోజన (PMJJBY) కింద ఏడాదికి 436 రూపాయలతో 2 లక్షల జీవిత బీమా లభిస్తుంది. బ్యాంక్ ఖాతా ఉన్న ఎవరైనా ఈ పథకాలను తీసుకోవచ్చు.",
            "source": "insurance_schemes_te.md"
        },
        {
            "id": "doc_mr_insurance",
            "text": "प्रधानमंत्री सुरक्षा विमा योजनेत (PMSBY) वर्षाला फक्त 20 रुपयांत 2 लाख रुपयांचा अपघात विमा मिळतो. प्रधानमंत्री जीवन ज्योती विमा योजनेत (PMJJBY) वर्षाला 436 रुपयांत 2 लाख रुपयांचा जीवन विमा मिळतो. बँक खाते असलेला कोणताही नागरिक हे दोन्ही विमे घेऊ शकतो.",
            "source": "insurance_schemes_mr.md"
        },

        # ── 8. Budgeting & Daily Savings Habits ──────────────────────────────
        {
            "id": "doc_en_budgeting",
            "text": "The 50-30-20 rule is a simple guide: 50% of your earnings for essential daily needs (food, ration, medicine, house), 30% for occasional wants (clothes, celebrations), and 20% put away into savings. Saving even 20 to 50 rupees regularly like a fistful of grain builds a safety cushion for emergencies.",
            "source": "budgeting_and_savings_en.md"
        },
        {
            "id": "doc_hi_budgeting",
            "text": "50-30-20 नियम कमाई को बांटने का सीधा तरीका है: 50% जरूरी खर्चों (राशन, दवा, घर खर्च) के लिए, 30% त्योहार या कपड़ों के लिए, और 20% बचत के लिए अलग रखें। जैसे रोज एक मुट्ठी अनाज अलग रखते हैं, वैसे ही रोज 20-50 रुपये बचाने से मुसीबत के समय बहुत बड़ा सहारा मिलता है।",
            "source": "budgeting_and_savings_hi.md"
        },
        {
            "id": "doc_te_budgeting",
            "text": "50-30-20 నియమం ఆదాయాన్ని పంచుకోవడానికి సులభమైన పద్ధతి: సంపాదనలో 50% నిత్యావసరాలు (తిండి, మందులు), 30% పండుగలు లేదా దుస్తులు, మరియు 20% పొదుపు కోసం పక్కన పెట్టండి. రోజూ ఒక పిడికెడు ధాన్యం దాచినట్లు, ప్రతిరోజూ 20-50 రూపాయలు దాస్తే కష్టకాలంలో పెద్ద ఆసరాగా నిలుస్తుంది.",
            "source": "budgeting_and_savings_te.md"
        },
        {
            "id": "doc_mr_budgeting",
            "text": "50-30-20 नियम पैशांचे नियोजन करण्याचा सोपा मार्ग आहे: उत्पन्नाचा 50% भाग गरजांसाठी (अन्नधान्य, औषधे), 30% सण किंवा कपड्यांसाठी आणि 20% बचतीसाठी वेगळा ठेवा. रोज मूठभर धान्य बाजूला काढतो तसेच दररोज 20-50 रुपये बाजूला ठेवल्यास अडीअडचणीच्या वेळी मोठा आधार मिळतो.",
            "source": "budgeting_and_savings_mr.md"
        },
    ]

    ids = [d["id"] for d in docs]
    documents = [d["text"] for d in docs]
    metadatas = [{"source": d["source"]} for d in docs]

    collection.upsert(
        ids=ids,
        documents=documents,
        metadatas=metadatas,
    )
    logger.info("Successfully seeded/upserted %d multilingual financial documents.", len(docs))


def rag_search(query: str, n_results: int = 2) -> str:
    """
    Search the ChromaDB index for relevant content.
    Returns JSON formatted string for the LLM to consume.
    """
    try:
        collection = get_chroma_client()
        # For intfloat/multilingual-e5-base, prefixing queries is recommended for best results
        # but the wrapper does standard encoding. We'll pass the query directly.
        results = collection.query(
            query_texts=[query],
            n_results=n_results,
        )
        
        formatted_results = []
        if results and results['documents'] and len(results['documents']) > 0:
            for idx, doc in enumerate(results['documents'][0]):
                meta = results['metadatas'][0][idx] if results['metadatas'] else {}
                formatted_results.append({
                    "content": doc,
                    "source": meta.get("source", "unknown")
                })
        
        return json.dumps({
            "results": formatted_results,
            "query": query
        })
    except Exception as e:
        logger.error("Error during RAG search: %s", e)
        return json.dumps({"error": str(e), "query": query})
