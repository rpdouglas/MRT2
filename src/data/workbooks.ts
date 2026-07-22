/**
 * src/data/workbooks.ts
 * GITHUB COMMENT:
 * [workbooks.ts]
 * FEAT: Integrated the new 'Women for Recovery' workbook.
 * TYPE: Expanded Workbook type to include 'specialty' to trigger the purple UI theme.
 * CONTENT: Adapted workbook Section 8 to use 'Overdose & Survival Reframe' language per project standards.
 */

export interface Question {
  id: string;
  text: string;
  context?: string; // Optional context/quote from literature (The Insight)
  type?: 'input' | 'read_only'; // Defaults to 'input' if undefined
  helperText?: string;
}

export interface WorkbookSection { id: string; title: string; description?: string; questions: Question[]; }

export interface Workbook {
  id: string;
  title: string;
  description: string;
  type: 'linear' | 'steps' | 'general' | 'specialty';
  sections: WorkbookSection[];
  estimatedTime?: string;
}

// --- 1. GENERAL RECOVERY WORKBOOK (25 Questions) ---
const generalQuestions: Question[] = [
  { id: 'gen_1', text: "What are the specific consequences of your addiction that led you to seek recovery?" },
  { id: 'gen_2', text: "Describe a time when you tried to control your using but failed." },
  { id: 'gen_3', text: "How has your addiction affected your relationships with family and friends?" },
  { id: 'gen_4', text: "What emotions trigger your desire to use?" },
  { id: 'gen_5', text: "List 5 things you are grateful for today." },
  { id: 'gen_6', text: "What does 'rock bottom' mean to you, and do you feel you hit it?" },
  { id: 'gen_7', text: "How does honesty play a role in your recovery?" },
  { id: 'gen_8', text: "What are your biggest fears about living sober?" },
  { id: 'gen_9', text: "Who are the people in your support network?" },
  { id: 'gen_10', text: "What hobbies or activities did you neglect during active addiction?" },
  { id: 'gen_11', text: "Describe your physical health during active addiction versus now." },
  { id: 'gen_12', text: "What lies did you tell yourself to justify your using?" },
  { id: 'gen_13', text: "How has your addiction impacted your career or education?" },
  { id: 'gen_14', text: "What specific boundaries do you need to set to protect your sobriety?" },
  { id: 'gen_15', text: "How do you handle stress without substances?" },
  { id: 'gen_16', text: "What does a 'spiritual awakening' mean to you?" },
  { id: 'gen_17', text: "List 3 short-term goals for your recovery." },
  { id: 'gen_18', text: "List 3 long-term goals for your life." },
  { id: 'gen_19', text: "How can you be of service to others?" },
  { id: 'gen_20', text: "What resentments are you holding onto, and how do they affect you?" },
  { id: 'gen_21', text: "Describe a situation where you successfully navigated a craving." },
  { id: 'gen_22', text: "What does 'taking it one day at a time' look like in practice?" },
  { id: 'gen_23', text: "How do you practice self-care?" },
  { id: 'gen_24', text: "What advice would you give to your past self?" },
  { id: 'gen_25', text: "Why is recovery worth it for you?" },
];

// --- 2. 12-STEP WORKBOOK (Unified Steps Approach) ---

// -- STEP 1 (Fully Populated from User Doc) --
const step1Questions: Question[] = [
  // Intro
  {
    id: 's1_intro',
    type: 'read_only',
    text: `Step 1: "We admitted we were powerless over our addiction—that our lives had become unmanageable."\n\nIntroduction:\nStep 1 is the foundation of recovery. It is about surrendering the illusion of control. It asks us to honestly admit that our best thinking has failed us and that our compulsive behaviors have consequences we can no longer manage alone.`
  },
  // Section 1: The Nature of Powerlessness
  { id: 's1_q1', type: 'input', text: "Can you describe a specific time when you sincerely tried to stop or control your behavior but failed?", context: "Powerlessness isn't weakness; it is the realization that your willpower alone is insufficient against the disease of addiction. It is accepting that once you start, you lose the ability to stop." },
  { id: 's1_q2', type: 'input', text: "How does the obsession manifest in your mind before you even take the first action/drink/drug?", context: "Powerlessness isn't weakness; it is the realization that your willpower alone is insufficient against the disease of addiction. It is accepting that once you start, you lose the ability to stop." },
  { id: 's1_q3', type: 'input', text: "In what ways have you tried to bargain with your addiction (e.g., \"I'll only do it on weekends\")?", context: "Powerlessness isn't weakness; it is the realization that your willpower alone is insufficient against the disease of addiction. It is accepting that once you start, you lose the ability to stop." },
  { id: 's1_q4', type: 'input', text: "Do you feel a physical or mental shift when you engage in your addictive behavior that makes it hard to stop?", context: "Powerlessness isn't weakness; it is the realization that your willpower alone is insufficient against the disease of addiction. It is accepting that once you start, you lose the ability to stop." },
  { id: 's1_q5', type: 'input', text: "What does the word \"defeat\" mean to you in the context of your recovery?", context: "Powerlessness isn't weakness; it is the realization that your willpower alone is insufficient against the disease of addiction. It is accepting that once you start, you lose the ability to stop." },
  
  // Section 2: Unmanageability in Daily Life
  { id: 's1_q6', type: 'input', text: "How has your addiction affected your financial stability or career/school performance?", context: "Unmanageability doesn't always look like a car crash. It is the internal chaos, the missed commitments, the financial stress, and the emotional volatility that addiction brings into our daily existence." },
  { id: 's1_q7', type: 'input', text: "Have you missed important events or obligations due to using or recovering from using?", context: "Unmanageability doesn't always look like a car crash. It is the internal chaos, the missed commitments, the financial stress, and the emotional volatility that addiction brings into our daily existence." },
  { id: 's1_q8', type: 'input', text: "In what ways has your home life or living environment become chaotic?", context: "Unmanageability doesn't always look like a car crash. It is the internal chaos, the missed commitments, the financial stress, and the emotional volatility that addiction brings into our daily existence." },
  { id: 's1_q9', type: 'input', text: "How do you manage your emotions when things don't go your way? Is it manageable?", context: "Unmanageability doesn't always look like a car crash. It is the internal chaos, the missed commitments, the financial stress, and the emotional volatility that addiction brings into our daily existence." },
  { id: 's1_q10', type: 'input', text: "Do you feel like you are driving the car of your life, or are you a passenger in a runaway vehicle?", context: "Unmanageability doesn't always look like a car crash. It is the internal chaos, the missed commitments, the financial stress, and the emotional volatility that addiction brings into our daily existence." },

  // Section 3: The Emotional Toll
  { id: 's1_q11', type: 'input', text: "How has isolation played a role in your addiction?", context: "Addiction is isolating. It convinces us we are alone and that no one understands. Breaking through this denial involves looking at the emotional wreckage—the guilt, shame, and fear—that we have been carrying." },
  { id: 's1_q12', type: 'input', text: "What relationships have been damaged or lost because of your behavior?", context: "Addiction is isolating. It convinces us we are alone and that no one understands. Breaking through this denial involves looking at the emotional wreckage—the guilt, shame, and fear—that we have been carrying." },
  { id: 's1_q13', type: 'input', text: "Do you struggle with self-worth or self-esteem? How does using affect that?", context: "Addiction is isolating. It convinces us we are alone and that no one understands. Breaking through this denial involves looking at the emotional wreckage—the guilt, shame, and fear—that we have been carrying." },
  { id: 's1_q14', type: 'input', text: "What lies do you tell yourself to justify the pain you are in?", context: "Addiction is isolating. It convinces us we are alone and that no one understands. Breaking through this denial involves looking at the emotional wreckage—the guilt, shame, and fear—that we have been carrying." },
  { id: 's1_q15', type: 'input', text: "Are you ready to let go of the control you never really had?", context: "Addiction is isolating. It convinces us we are alone and that no one understands. Breaking through this denial involves looking at the emotional wreckage—the guilt, shame, and fear—that we have been carrying." },
];

// -- STEP 2 (Fully Populated) --
const step2Questions: Question[] = [
  {
    id: 's2_intro',
    type: 'read_only',
    text: `Step 2: "Came to believe that a Power greater than ourselves could restore us to sanity."\n\nIntroduction:\nStep 2 is a bridge from surrender to hope. Having admitted we are powerless, we now consider the possibility that something bigger than our own willpower can help us find our way back to sane thinking. This Power doesn't have to look like anyone else's - it only has to be bigger than our addiction.`
  },
  // Section 1: Sanity vs Insanity in Addiction
  { id: 's2_q1', type: 'input', text: "What does \"insanity\" mean to you when you look honestly at your own using patterns?", context: "Insanity here isn't a clinical label - it's the simple, repeated act of doing the same self-destructive thing and expecting a different result. Naming it removes the shame and makes it something we can actually work on." },
  { id: 's2_q2', type: 'input', text: "Describe a moment when your thinking convinced you that \"this time will be different,\" even though the evidence said otherwise.", context: "Addiction runs on a kind of internal salesmanship - a voice that reframes bad ideas as reasonable ones. Recognizing that voice is the first step in not obeying it." },
  { id: 's2_q3', type: 'input', text: "What's the difference between the version of you that plans to use and the version of you that has to live with the consequences the next day?", context: "Many people in recovery describe two competing selves: one that negotiates in the moment, and one that pays the bill later. Step 2 asks us to start trusting the second one." },
  { id: 's2_q4', type: 'input', text: "In what ways has your own reasoning failed to protect you, even when you were genuinely trying to stay sober?", context: "This step isn't an insult to your intelligence. It's an acknowledgment that willpower and logic, on their own, haven't been enough to solve this particular problem." },
  { id: 's2_q5', type: 'input', text: "What would it look like to stop trying to out-think your addiction and instead ask for help?", context: "Coming to believe starts with a small act of humility - admitting that solving this alone hasn't worked, and staying curious about what might." },
  // Section 2: Defining a Higher Power
  { id: 's2_q6', type: 'input', text: "What does the phrase \"a Power greater than ourselves\" mean to you right now, even if the answer is still forming?", context: "This program deliberately leaves the definition open. It could be a spiritual belief, the recovery community itself, nature, or simply the accumulated wisdom of everyone who's walked this path before you." },
  { id: 's2_q7', type: 'input', text: "Have you ever experienced something - in nature, in a relationship, in a group - that felt bigger than your individual willpower? Describe it.", context: "Many people find their first sense of a Higher Power not in a church or text, but in an ordinary moment of connection or awe. Step 2 asks us to notice those moments rather than dismiss them." },
  { id: 's2_q8', type: 'input', text: "What past experiences (religious, cultural, or personal) make this step easier or harder for you?", context: "Old wounds around religion or authority are common and valid. Step 2 isn't asking you to adopt anyone else's God - only to stay open to some source of help outside your own head." },
  { id: 's2_q9', type: 'input', text: "If you can't yet define your Higher Power, could the recovery group itself temporarily serve that role for you?", context: "It's a well-worn shortcut in these rooms: the group itself is a real, working starting point for a Higher Power. You don't need certainty to begin - only willingness." },
  { id: 's2_q10', type: 'input', text: "What fears come up when you imagine trusting something outside of your own control?", context: "Handing over control feels dangerous after a life spent trying to manage everything alone. Step 2 asks for willingness to experiment with trust, not a leap of blind faith all at once." },
  // Section 3: The Process of Coming to Believe
  { id: 's2_q11', type: 'input', text: "What is one small piece of evidence from your own life that recovery - for you or someone else - is actually possible?", context: "Belief rarely arrives all at once. It accumulates from small proofs: a stranger's story, a moment of calm, a promise kept. Step 2 asks us to start collecting that evidence deliberately." },
  { id: 's2_q12', type: 'input', text: "Where in your life have you already seen \"insanity\" interrupted - a pattern broken, even briefly?", context: "If you've ever had one clean day, one honest conversation, or one craving that passed without you acting on it, you already have direct experience that restoration is possible." },
  { id: 's2_q13', type: 'input', text: "What would it feel like to act \"as if\" you believed recovery was possible, even before you fully do?", context: "Action often comes before belief in this process. Showing up, doing the next right thing, and staying teachable can build the very faith the step is asking for." },
  { id: 's2_q14', type: 'input', text: "Who in your life models the kind of sanity or peace you're hoping to find for yourself?", context: "Watching someone else's recovery is often the clearest evidence available. Their sanity becomes proof that yours is possible too." },
  { id: 's2_q15', type: 'input', text: "What is one concrete way you can stay open this week to the idea that help exists outside yourself?", context: "Coming to believe is a practice, not a single decision. It might look like attending a meeting, praying, journaling, or simply pausing before reacting - each one is a rep in building that trust." },
];

// -- STEP 3 (Fully Populated) --
const step3Questions: Question[] = [
  {
    id: 's3_intro',
    type: 'read_only',
    text: `Step 3: "Made a decision to turn our will and our lives over to the care of God as we understood Him."\n\nIntroduction:\nStep 3 turns belief into action. Having considered that a greater Power could help, we now make a decision to stop steering alone and let that Power - however we understand it - take the wheel in the moments we're most likely to crash.`
  },
  // Section 1: The Decision vs the Action
  { id: 's3_q1', type: 'input', text: "What is the difference between deciding to let go of control and actually doing it in a stressful moment?", context: "Step 3 is famously \"a decision,\" not a finished transformation. It's normal to make the decision many times before it starts to feel automatic." },
  { id: 's3_q2', type: 'input', text: "Describe a recent moment where you said you'd \"let go\" of a problem but kept mentally managing it anyway.", context: "Turning our will over is rarely one clean motion - it's often catching ourselves mid-grip and choosing, again, to open our hands." },
  { id: 's3_q3', type: 'input', text: "What does \"turning it over\" look like in practice for you - a phrase, a pause, a specific action?", context: "Having a concrete, repeatable gesture (a phrase, a breath, a call to someone) turns an abstract decision into something you can actually do under pressure." },
  { id: 's3_q4', type: 'input', text: "What's one area of your life where you say you trust the process, but your behavior says otherwise?", context: "Our actions are usually more honest than our stated beliefs. Noticing the gap is not a failure - it's useful information about where the real work is." },
  { id: 's3_q5', type: 'input', text: "What would change in your daily routine if this decision were fully real to you?", context: "A decision that changes nothing about how you act each day is still just an idea. Step 3 asks the decision to eventually show up in behavior." },
  // Section 2: Letting Go of Self-Will
  { id: 's3_q6', type: 'input', text: "In what situations does your self-will run most strongly - control, image, being right?", context: "Self-will isn't just stubbornness; it's often a survival strategy built during years when nobody else was reliably steering for you. Recognizing its favorite triggers is the first step in loosening its grip." },
  { id: 's3_q7', type: 'input', text: "What has excessive self-will cost you in relationships or opportunities?", context: "Insisting on doing everything your own way often protects you from short-term discomfort at the cost of long-term connection and growth." },
  { id: 's3_q8', type: 'input', text: "What are you most afraid would happen if you stopped trying to control an outcome you care about?", context: "Underneath most self-will is fear - fear of being hurt, disappointed, or exposed. Naming the fear directly is often more useful than fighting the controlling behavior itself." },
  { id: 's3_q9', type: 'input', text: "Can you recall a time letting go of control actually led to a better outcome than you expected?", context: "Every experience of surrender that turns out okay becomes evidence for the next one. We build trust in the process one lived example at a time." },
  { id: 's3_q10', type: 'input', text: "What is one relationship or situation you're still trying to control today that you could practice releasing?", context: "You don't have to let go of everything at once. Step 3 grows through small, specific releases rather than one dramatic surrender." },
  // Section 3: Moving from Fear to Faith
  { id: 's3_q11', type: 'input', text: "What fears about the future keep you gripping the wheel instead of trusting the process?", context: "Fear and faith rarely occupy the same moment. Naming the specific fear underneath your grip is often the fastest way to loosen it." },
  { id: 's3_q12', type: 'input', text: "What is one worry you're carrying today that you could consciously set down, even for an hour?", context: "Turning our will over doesn't have to mean forever - it can start as an experiment: just for today, just for this hour." },
  { id: 's3_q13', type: 'input', text: "Where have you already seen faith (in the process, in other people, in yourself) replace fear, even briefly?", context: "Faith isn't the absence of fear; it's having enough evidence to act anyway. Every small win builds that evidence." },
  { id: 's3_q14', type: 'input', text: "What would \"a life on life's terms\" look like for you if you weren't fighting to control every outcome?", context: "Recovery often points toward acceptance, not passivity - engaging fully with life while releasing the demand that it go exactly your way." },
  { id: 's3_q15', type: 'input', text: "What is one prayer, mantra, or phrase you could use this week as a physical cue to turn something over?", context: "A simple, repeatable ritual - a phrase, a breath, a specific gesture - turns Step 3 from an abstract idea into a tool you can reach for in a real moment." },
];

// -- STEP 4 (Fully Populated) --
const step4Questions: Question[] = [
  {
    id: 's4_intro',
    type: 'read_only',
    text: `Step 4: "Made a searching and fearless moral inventory of ourselves."\n\nIntroduction:\nStep 4 is where we finally turn the light inward. After admitting powerlessness and finding a source of support, we take stock of who we actually are - not to punish ourselves, but to see clearly enough to change. A good inventory looks at both the wreckage and the strengths, without flinching from either.`
  },
  // Section 1: The Purpose of Inventory
  { id: 's4_q1', type: 'input', text: "What are you hoping to gain by looking honestly at your own history, rather than avoiding it?", context: "An inventory isn't self-punishment - it's closer to an accountant reconciling a ledger. The goal is an accurate picture, not a harsher one." },
  { id: 's4_q2', type: 'input', text: "What has kept you from doing this kind of honest self-examination before now?", context: "Most people avoid inventory because they expect it to confirm their worst fears about themselves. In practice, it usually reveals more nuance - and more humanity - than the shame allows for." },
  { id: 's4_q3', type: 'input', text: "What would \"fearless\" actually look like for you, given what you're most afraid to find?", context: "Fearless doesn't mean feeling no fear - it means writing the truth down even while the fear is present." },
  { id: 's4_q4', type: 'input', text: "What's the risk of continuing to carry an unexamined past into your recovery?", context: "Unexamined history doesn't disappear; it tends to leak out sideways - as resentment, anxiety, or relapse triggers - until it's looked at directly." },
  { id: 's4_q5', type: 'input', text: "Who could you trust to eventually hear this inventory, even if you're only writing it for yourself right now?", context: "Step 4 is written in private, but it's meant to eventually be spoken to another person in Step 5. Knowing that in advance can help you write with more honesty." },
  // Section 2: Resentments and Fears
  { id: 's4_q6', type: 'input', text: "Who are you still holding a resentment against, and what specifically do you feel they took from you?", context: "Resentment is often described as one of the most common triggers for relapse. Naming it specifically - not just \"I'm angry at them\" - starts to drain its power." },
  { id: 's4_q7', type: 'input', text: "In each resentment you listed, what part, if any, was actually your responsibility?", context: "This isn't about excusing harm done to you. It's about finding the sliver of the situation you can actually do something about, since that's the only part you can change." },
  { id: 's4_q8', type: 'input', text: "What recurring fears show up across multiple areas of your life - money, relationships, health?", context: "Fear often behaves like a malfunctioning protection system, running programs built for an old danger that isn't happening right now. Naming the pattern helps you recognize it in the moment." },
  { id: 's4_q9', type: 'input', text: "How have your fears driven decisions you now regret?", context: "Most self-destructive choices make more sense once you see the fear that was actually driving them - fear of abandonment, failure, or not being enough." },
  { id: 's4_q10', type: 'input', text: "What is one resentment or fear you're ready to actively work on releasing, starting today?", context: "You don't have to resolve the whole list at once. Picking one item and working it is more useful than staring at the entire inventory and feeling overwhelmed." },
  // Section 3: Assets and Liabilities
  { id: 's4_q11', type: 'input', text: "What are three genuine strengths or good qualities you have, even during your worst days?", context: "A fearless inventory looks at assets as honestly as it looks at defects. Many people in early recovery have never once written down what's actually good about them." },
  { id: 's4_q12', type: 'input', text: "What patterns of behavior - your liabilities - show up across more than one relationship or situation?", context: "Liabilities usually aren't isolated incidents; they're patterns. Seeing the pattern, rather than just the individual moments, is what makes change possible." },
  { id: 's4_q13', type: 'input', text: "Which of your liabilities do you suspect was once a survival skill that's now outlived its usefulness?", context: "Many defects started as protection - control kept you safe once, isolation kept you from being hurt once. Recognizing the old purpose makes it easier to retire the habit with compassion instead of shame." },
  { id: 's4_q14', type: 'input', text: "How do your assets and liabilities show up together in the same situation - for example, loyalty that becomes over-control?", context: "Strengths and defects are often two sides of the same trait. Seeing that connection helps you keep the strength while working on the excess." },
  { id: 's4_q15', type: 'input', text: "If you read this inventory back in a year, what would you want to have already changed?", context: "An inventory is a snapshot, not a life sentence. Writing down where you want to grow gives the rest of the steps something concrete to aim at." },
];

// -- STEP 5 (Fully Populated) --
const step5Questions: Question[] = [
  {
    id: 's5_intro',
    type: 'read_only',
    text: `Step 5: "Admitted to God, to ourselves, and to another human being the exact nature of our wrongs."\n\nIntroduction:\nStep 5 takes the private inventory of Step 4 and says it out loud to someone else. This is often the most feared step and, for many people, the most relieving. Secrets lose much of their power the moment they're spoken to another person who doesn't recoil.`
  },
  // Section 1: The Value of Confession
  { id: 's5_q1', type: 'input', text: "What do you imagine would happen if someone else heard the full truth of your Step 4 inventory?", context: "Most catastrophic imaginings about being \"found out\" turn out to be worse in our heads than in reality. Saying it out loud tests that fear against the truth." },
  { id: 's5_q2', type: 'input', text: "What's the difference between confessing something and simply venting about it?", context: "Venting keeps the story about how we were wronged. Confession is about naming our own part, plainly and without excuse, to someone who can hear it." },
  { id: 's5_q3', type: 'input', text: "What do you hope changes in you after this step, beyond just relief?", context: "Step 5 aims at more than catharsis - it aims at no longer needing secrecy to survive. Naming a goal beyond \"feeling better\" keeps the step honest." },
  { id: 's5_q4', type: 'input', text: "What's one thing on your list you're most tempted to soften or leave out when you say it aloud?", context: "The item you most want to skip is often the one carrying the most weight. Naming it directly, rather than the edited version, is where the real relief lives." },
  { id: 's5_q5', type: 'input', text: "Why do you think this program insists on saying wrongs aloud to a real person, rather than just to yourself?", context: "A private admission can still be argued with in your own head. Speaking it to another human being who hears it and doesn't leave makes it real in a way journaling alone can't." },
  // Section 2: Overcoming Shame
  { id: 's5_q6', type: 'input', text: "What is the difference between guilt over something you did and shame about who you believe you are?", context: "Guilt says \"I did a bad thing.\" Shame says \"I am a bad person.\" Step 5 is aimed squarely at dismantling the second one." },
  { id: 's5_q7', type: 'input', text: "What specific belief about yourself has this shame been protecting or reinforcing?", context: "Shame often masquerades as self-protection - staying hidden feels safer than risking rejection. But it's usually reinforcing the very isolation that fuels addiction." },
  { id: 's5_q8', type: 'input', text: "What would you say to a friend who confessed the exact same things you're carrying?", context: "Most people extend more compassion to others than to themselves for identical mistakes. Borrowing that same compassion for yourself is part of this step's work." },
  { id: 's5_q9', type: 'input', text: "What has kept you from believing that you could be fully known and still be accepted?", context: "Many people carry a quiet belief that full honesty would cost them every relationship they have. Step 5 tests that belief with a real person instead of just an assumption." },
  { id: 's5_q10', type: 'input', text: "What would it feel like to no longer need to manage other people's image of you?", context: "A lot of energy goes into curating how we're seen. Letting one person see the whole truth starts to free up that energy for recovery instead." },
  // Section 3: Building Trust
  { id: 's5_q11', type: 'input', text: "Who is someone in your life - sponsor, counselor, trusted friend - who could safely hear this?", context: "The person matters. Step 5 works best with someone who has enough experience or discretion to hear hard things without judgment or gossip." },
  { id: 's5_q12', type: 'input', text: "What would help you trust that person enough to be fully honest, rather than editing?", context: "Trust is often built in smaller test disclosures before the big one. If full honesty feels too risky yet, start with a smaller truth and see how it's received." },
  { id: 's5_q13', type: 'input', text: "What's one piece of evidence from your life that being known honestly can deepen a relationship rather than end it?", context: "Most people can point to at least one moment where honesty, though frightening, brought someone closer instead of driving them away." },
  { id: 's5_q14', type: 'input', text: "After sharing your inventory, what do you want your relationship with that listener to look like going forward?", context: "Step 5 isn't just a single conversation - it can become the start of an ongoing, more honest relationship with the people you trust most." },
  { id: 's5_q15', type: 'input', text: "What is one way you can practice this same honesty on a smaller scale, this week, before or after doing the full Step 5?", context: "Rigorous honesty is a muscle. Practicing it in small daily moments makes the larger confession less of a singular, terrifying event." },
];

// -- STEP 6 (Fully Populated) --
const step6Questions: Question[] = [
  {
    id: 's6_intro',
    type: 'read_only',
    text: `Step 6: "Were entirely ready to have God remove all these defects of character."\n\nIntroduction:\nStep 6 is a pause between confession and change. Having named our defects in Steps 4 and 5, we now sit with the question of whether we're actually ready to let them go - because some of them have been protecting us for a long time, and giving them up isn't as simple as it sounds.`
  },
  // Section 1: The Difference Between Step 6 and 7
  { id: 's6_q1', type: 'input', text: "What do you think \"entirely ready\" means, compared to just wanting your life to be easier?", context: "Step 6 asks for readiness, not action - that comes in Step 7. It's a subtle but important distinction: this step is about the internal shift, not yet the request." },
  { id: 's6_q2', type: 'input', text: "Which of your defects do you feel fully ready to release, and which ones are you still unsure about?", context: "Complete readiness for every defect at once is rare. Being honest about partial readiness is more useful than pretending to a certainty you don't feel." },
  { id: 's6_q3', type: 'input', text: "What would it mean to be willing to let go of a defect even before you know exactly how to replace it?", context: "Readiness doesn't require a replacement plan already in hand. It only requires being willing to find out what comes next." },
  { id: 's6_q4', type: 'input', text: "Why do you think this step separates \"being ready\" from \"asking\" in Step 7?", context: "Rushing to ask without genuine readiness often produces a shallow, temporary change. This step protects the process by making sure the willingness is real first." },
  { id: 's6_q5', type: 'input', text: "What tells you the difference between saying you're ready and actually being ready?", context: "Real readiness usually shows up as relief at the idea of the defect leaving, rather than a reluctant obligation to say the \"right\" thing." },
  // Section 2: Becoming Ready
  { id: 's6_q6', type: 'input', text: "What benefit has a specific character defect given you, even while it's also caused harm?", context: "Every defect earns its keep somehow - control might bring safety, anger might bring a sense of power. Naming the payoff makes the defect easier to release honestly." },
  { id: 's6_q7', type: 'input', text: "What would you be afraid of losing if this defect were actually removed?", context: "Fear of the empty space a defect leaves behind is a common, normal block to readiness. It helps to name that fear directly rather than let it quietly stall the process." },
  { id: 's6_q8', type: 'input', text: "What is one small, low-stakes situation where you could practice being ready to respond differently?", context: "Readiness can be built in small reps before it's tested in high-stakes moments. Practicing on the easy cases builds the muscle for the hard ones." },
  { id: 's6_q9', type: 'input', text: "What has happened in the past when you tried to white-knuckle a defect away through sheer willpower alone?", context: "This step exists partly because willpower alone has usually already failed at this specific task. Readiness is about being willing to try a different approach - with help." },
  { id: 's6_q10', type: 'input', text: "What would change in your relationships if you were even 10% more ready to let go of this defect?", context: "Readiness doesn't have to be total to start producing real change. A small increase in willingness can already shift how you show up for people." },
  // Section 3: Letting Go of Old Survival Mechanisms
  { id: 's6_q11', type: 'input', text: "What situation in your past first taught you to rely on this particular defect to survive?", context: "Most defects started as smart adaptations to a genuinely hard situation. Understanding their origin makes it possible to thank them and still let them go." },
  { id: 's6_q12', type: 'input', text: "Is the situation that created this defense still happening in your life today?", context: "Many defenses built years ago are still running on autopilot long after the original threat is gone. Noticing that the danger has passed is often what makes release possible." },
  { id: 's6_q13', type: 'input', text: "What would a healthier version of this same protective instinct look like?", context: "The goal usually isn't to delete the underlying need (for safety, respect, connection) but to meet it in a way that doesn't also cause harm." },
  { id: 's6_q14', type: 'input', text: "Who do you know who has released a similar defect and seems better for it?", context: "Watching someone else successfully retire a defense you still rely on is often more convincing than any argument for why you should let it go." },
  { id: 's6_q15', type: 'input', text: "What is one sign this week that would tell you you're becoming more ready, even if the defect hasn't fully left yet?", context: "Readiness tends to arrive gradually, in small signs - a pause before reacting, a moment of choice where there used to be automatic behavior." },
];

// -- STEP 7 (Fully Populated) --
const step7Questions: Question[] = [
  {
    id: 's7_intro',
    type: 'read_only',
    text: `Step 7: "Humbly asked Him to remove our shortcomings."\n\nIntroduction:\nStep 7 turns the readiness of Step 6 into a request. Having decided we're willing to change, we ask - humbly, not desperately or on our own terms - for help doing what our own effort alone couldn't accomplish.`
  },
  // Section 1: Defining Humility
  { id: 's7_q1', type: 'input', text: "What does \"humility\" mean to you, separate from humiliation or low self-worth?", context: "Humility here isn't about thinking less of yourself - it's about having an accurate view of yourself, strengths and shortcomings both, without inflating or shrinking either." },
  { id: 's7_q2', type: 'input', text: "Where in your life have you confused humility with weakness?", context: "Asking for help is often mislabeled as weakness by people who've had to be self-reliant to survive. Step 7 reframes the request as strength, not surrender of self-worth." },
  { id: 's7_q3', type: 'input', text: "What's the difference between asking for something humbly and demanding it?", context: "A demand assumes control over the outcome and the timeline. A humble request lets go of both, while still being clear about what you're asking for." },
  { id: 's7_q4', type: 'input', text: "What would it look like to accept help with your shortcomings without immediately trying to control how or when it happens?", context: "Step 7 asks us to make the request and then let go of managing the results, which is often the hardest part for people used to handling everything themselves." },
  { id: 's7_q5', type: 'input', text: "What's one area of your life where practicing more humility could actually make things easier, not harder?", context: "Contrary to fear, humility often reduces the exhausting effort of maintaining an image. Letting go of the performance can be a relief." },
  // Section 2: The Practice of Asking
  { id: 's7_q6', type: 'input', text: "What specific shortcoming from your Step 6 list are you ready to ask to have removed today?", context: "This step works best when it's specific rather than a vague, general request. Naming the exact shortcoming makes the ask concrete and trackable." },
  { id: 's7_q7', type: 'input', text: "What form does \"asking\" take for you - a prayer, a conversation with a sponsor, a private commitment?", context: "The mechanics of asking are flexible and personal. What matters is the sincerity of the request, not the specific words or ritual used." },
  { id: 's7_q8', type: 'input', text: "What have you noticed changes in you simply from the act of asking, even before you see external results?", context: "Many people find that the humility required to ask is itself part of the transformation, independent of how quickly the shortcoming actually fades." },
  { id: 's7_q9', type: 'input', text: "How do you typically respond when change doesn't happen as quickly as you'd like after asking?", context: "Shortcomings rarely vanish overnight. Impatience with the pace is common - the step asks for continued humility even in the waiting." },
  { id: 's7_q10', type: 'input', text: "What would it look like to ask again tomorrow, even if today's request didn't feel like it \"worked\"?", context: "Step 7 isn't a one-time transaction. It's often repeated daily, especially for stubborn shortcomings that take longer to loosen their grip." },
  // Section 3: Changing Our Behavior
  { id: 's7_q11', type: 'input', text: "What specific behavior would look different in your daily life if this shortcoming were actually removed?", context: "Grounding the request in a concrete behavior change - not just a feeling - gives you something observable to notice as progress happens." },
  { id: 's7_q12', type: 'input', text: "What's one situation this week where you can practice acting differently, even if the old urge is still present?", context: "Change often shows up first in action, before it feels natural. Practicing the new behavior, even while it's uncomfortable, is part of how the shortcoming actually loosens." },
  { id: 's7_q13', type: 'input', text: "How will you know the shortcoming is genuinely easing, rather than you just suppressing it through effort?", context: "Real change tends to feel like the urge itself is quieter, not just successfully resisted through gritted teeth. Noticing that shift is useful feedback." },
  { id: 's7_q14', type: 'input', text: "Who can help hold you accountable to the behavior change you're hoping for here?", context: "Asking humbly often works better alongside real-world accountability - a sponsor, a friend, a group - rather than as a purely private, invisible process." },
  { id: 's7_q15', type: 'input', text: "What would you want to say to yourself a year from now about how this shortcoming changed?", context: "Writing toward a future version of the change - not just the immediate discomfort - keeps the step oriented toward growth rather than just relief." },
];

// -- STEP 8 (Fully Populated) --
const step8Questions: Question[] = [
  {
    id: 's8_intro',
    type: 'read_only',
    text: `Step 8: "Made a list of all persons we had harmed, and became willing to make amends to them all."\n\nIntroduction:\nStep 8 asks us to take stock of the wreckage we caused and become willing to repair it. This step is about willingness, not yet the amends themselves - that comes in Step 9. It's a chance to face the damage honestly, including the harm we may have minimized or explained away.`
  },
  // Section 1: Identifying Harm Done
  { id: 's8_q1', type: 'input', text: "Who is on your list, and what specifically did you do that harmed them?", context: "Specificity matters here - \"I hurt my family\" is true but vague. Naming the actual incident makes the amends that follow more honest and concrete." },
  { id: 's8_q2', type: 'input', text: "Whose name on this list surprised you when you first wrote it down?", context: "Some harm is obvious; other harm we've minimized for years. The names that surprise us often carry the most important unfinished business." },
  { id: 's8_q3', type: 'input', text: "Is there anyone you've left off this list because the harm felt too small to count?", context: "Small, repeated harms - broken promises, missed moments, small dishonesties - often add up to more damage than a single dramatic incident." },
  { id: 's8_q4', type: 'input', text: "How has this harm affected that person's life beyond the moment it happened?", context: "Understanding the ripple effects of our actions - not just the initial event - helps build the empathy that makes real amends possible later." },
  { id: 's8_q5', type: 'input', text: "What harm on this list are you most tempted to justify or explain away, and why?", context: "Justification is often our mind's way of protecting us from the discomfort of full accountability. Noticing the urge to explain is itself useful information." },
  // Section 2: Willingness vs Action
  { id: 's8_q6', type: 'input', text: "For which names on your list do you feel genuinely willing to make amends, right now?", context: "Willingness usually arrives unevenly - fully ready for some names, resistant about others. Being honest about where you actually stand is more useful than performing readiness you don't feel." },
  { id: 's8_q7', type: 'input', text: "Whose name on this list are you most resistant to, and what's underneath that resistance?", context: "Resistance to making amends with a specific person often points to unresolved anger, fear, or shame that's worth examining honestly before moving to Step 9." },
  { id: 's8_q8', type: 'input', text: "What would it cost you to become willing, even if you're not ready to act yet?", context: "Willingness itself sometimes feels risky - it means giving up the comfort of staying resentful or avoidant. Naming that cost honestly is part of the step." },
  { id: 's8_q9', type: 'input', text: "What's the difference between becoming willing and feeling obligated?", context: "Genuine willingness comes from wanting to repair the harm; obligation comes from wanting the guilt to stop. Both can coexist, but the step points toward the former." },
  { id: 's8_q10', type: 'input', text: "What would help you move from resistance to willingness for the hardest name on your list?", context: "Willingness often grows through smaller steps - talking it through with a sponsor, sitting with the discomfort, or simply asking to become willing even when you're not there yet." },
  // Section 3: Forgiveness of Self and Others
  { id: 's8_q11', type: 'input', text: "What would it mean to forgive yourself for the harm on this list, separate from whether the other person forgives you?", context: "Amends are owed regardless of whether forgiveness is granted. Learning to hold accountability and self-compassion at the same time is part of this step's work." },
  { id: 's8_q12', type: 'input', text: "Is there anyone on this list who also harmed you? How do you hold both truths at once?", context: "Harm is rarely one-directional. It's possible to make amends for your part while still acknowledging the ways you were also hurt." },
  { id: 's8_q13', type: 'input', text: "What would it feel like to finally put this list down instead of carrying it silently?", context: "Many people describe this list as a weight they've carried privately for years. Simply writing it down and becoming willing can bring real relief, even before any amends are made." },
  { id: 's8_q14', type: 'input', text: "What has kept you from forgiving yourself for what's on this list until now?", context: "Self-forgiveness is often the hardest amends of all. Many people can forgive others more easily than they forgive themselves for the same category of harm." },
  { id: 's8_q15', type: 'input', text: "What would it look like to hold yourself accountable for this harm without letting shame convince you that you're beyond repair?", context: "Accountability and shame are not the same thing. This step asks for the former - a clear-eyed look at what happened - without the latter's message that you are fundamentally broken." },
];

// -- STEP 9 (Fully Populated) --
const step9Questions: Question[] = [
  {
    id: 's9_intro',
    type: 'read_only',
    text: `Step 9: "Made direct amends to such people wherever possible, except when to do so would injure them or others."\n\nIntroduction:\nStep 9 puts the willingness from Step 8 into action. This is where we actually go to the people we've harmed - directly, specifically, and without expecting anything back - except in situations where doing so would cause more harm than good.`
  },
  // Section 1: Direct Amends vs Apologies
  { id: 's9_q1', type: 'input', text: "What's the difference between saying \"I'm sorry\" and making a direct amends?", context: "An apology names regret. A direct amends names the specific harm, takes responsibility without excuse, and often includes a changed behavior going forward." },
  { id: 's9_q2', type: 'input', text: "For one person on your list, what would a specific, direct amends actually sound like?", context: "Vague amends (\"I'm sorry for everything\") tend to feel hollow to the person receiving them. Naming the specific incident shows you've actually done the work." },
  { id: 's9_q3', type: 'input', text: "What is your amends actually for - relieving your own guilt, or repairing the other person's life?", context: "An amends focused on your own relief can come across as self-serving. The most effective amends center the other person's experience of the harm." },
  { id: 's9_q4', type: 'input', text: "What would it mean to make this amends without asking for forgiveness in return?", context: "True amends are offered, not traded. Expecting forgiveness as a condition of the amends puts pressure back on the person you harmed." },
  { id: 's9_q5', type: 'input', text: "How will you know if an apology alone is appropriate, versus a fuller direct amends?", context: "Not every harm requires an elaborate amends - sometimes a sincere, specific apology is the right-sized response. Discernment, often with a sponsor's help, matters here." },
  // Section 2: Living Amends
  { id: 's9_q6', type: 'input', text: "For a harm you can't directly repair (a person who's passed away, someone you can't locate), what would a \"living amends\" look like?", context: "When direct contact isn't possible, amends can take the form of changed behavior going forward - living differently in that same area of your life." },
  { id: 's9_q7', type: 'input', text: "What ongoing behavior change would be the clearest sign that your amends is real, not just a one-time conversation?", context: "Words are easy; sustained behavior is the real test. A living amends is proven over months, not in a single apology." },
  { id: 's9_q8', type: 'input', text: "Who is watching your behavior change as evidence that your amends was sincere?", context: "Family and friends often trust actions over words, especially after being disappointed before. Consistent behavior rebuilds trust that words alone can't." },
  { id: 's9_q9', type: 'input', text: "What would relapse into the old behavior undo about the amends you've already made?", context: "A direct amends followed by a return to the same harmful pattern tends to erase whatever trust was rebuilt. Living amends means the change has to hold." },
  { id: 's9_q10', type: 'input', text: "What's one concrete action this month that would count as a living amends for a harm you can't directly repair?", context: "Making this concrete - volunteering, financial repair, consistent presence - turns an abstract intention into something trackable." },
  // Section 3: Cleaning Up the Wreckage
  { id: 's9_q11', type: 'input', text: "Which amends on your list are safe and possible to make directly, right now?", context: "\"Wherever possible\" means starting with the amends that are clearly safe and doable, rather than waiting for every situation to feel perfectly comfortable." },
  { id: 's9_q12', type: 'input', text: "Which amends would injure the other person more than help them, and how do you know?", context: "This exception exists for real reasons - re-opening old wounds, endangering someone, or violating someone else's privacy. It requires honest judgment, not convenient avoidance." },
  { id: 's9_q13', type: 'input', text: "Is there an amends you've been avoiding under the excuse that it would \"cause harm,\" when really you're just afraid?", context: "It's worth checking this exception honestly, ideally with a sponsor - sometimes the fear of discomfort disguises itself as concern for the other person." },
  { id: 's9_q14', type: 'input', text: "How do you plan to make an amends that might also implicate someone else (a former using partner, an accomplice) without exposing them unfairly?", context: "Some amends require care in how much detail to share, especially when a third party's privacy or safety is involved. This is part of what the harm exception protects." },
  { id: 's9_q15', type: 'input', text: "After you've made the amends you can make, what will help you accept the parts of the wreckage that simply can't be undone?", context: "Not everything can be fully repaired. Part of this step is making peace with doing everything possible while accepting the limits of what amends can actually fix." },
];

// -- STEP 10 (Fully Populated) --
const step10Questions: Question[] = [
  {
    id: 's10_intro',
    type: 'read_only',
    text: `Step 10: "Continued to take personal inventory and when we were wrong promptly admitted it."\n\nIntroduction:\nStep 10 takes the deep work of Steps 4 through 9 and turns it into a daily habit. Instead of waiting for wreckage to pile up again, we check in with ourselves regularly and correct course quickly, before small mistakes turn into old patterns.`
  },
  // Section 1: Daily Inventory Practice
  { id: 's10_q1', type: 'input', text: "What would a short, honest check-in with yourself look like at the end of each day?", context: "A daily inventory doesn't need to be long - a few honest minutes reviewing where you were resentful, dishonest, or afraid is often enough to catch small issues early." },
  { id: 's10_q2', type: 'input', text: "What time of day would actually work for you to build this habit consistently?", context: "The specific ritual matters less than the consistency. Attaching it to an existing habit (before bed, after your morning coffee) makes it more likely to stick." },
  { id: 's10_q3', type: 'input', text: "What was one moment today where you handled something well, worth acknowledging?", context: "Daily inventory isn't only about catching wrongs - it's also meant to notice growth. Skipping the positive side makes the practice feel punishing instead of balanced." },
  { id: 's10_q4', type: 'input', text: "What was one moment today where you reacted in a way you'd like to have done differently?", context: "Catching a single reaction each day, rather than trying to review everything, keeps the practice manageable and sustainable." },
  { id: 's10_q5', type: 'input', text: "What pattern have you noticed repeating across several days of doing this inventory?", context: "A daily practice, kept over time, starts to reveal patterns invisible in any single day - a certain time, person, or situation that reliably triggers you." },
  // Section 2: Spot-Check Inventory
  { id: 's10_q6', type: 'input', text: "What did it feel like in your body the last time you noticed yourself getting resentful or afraid in the moment?", context: "A \"spot-check\" inventory happens in real time, not just at day's end - catching the physical signs of a reaction as it's building, before it turns into words or actions." },
  { id: 's10_q7', type: 'input', text: "What's your earliest physical or emotional warning sign that you're about to react rather than respond?", context: "Most people have a personal early-warning system - tight chest, racing thoughts, a clipped tone - that shows up before the reaction fully takes over. Learning to notice it buys you a pause." },
  { id: 's10_q8', type: 'input', text: "In a recent tense moment, what would pausing for even ten seconds have changed?", context: "A spot-check inventory is often just a pause - long enough to ask \"am I about to be selfish, dishonest, resentful, or afraid right now?\" before acting." },
  { id: 's10_q9', type: 'input', text: "What situations trigger you often enough that you could plan a spot-check in advance?", context: "Some triggers are predictable - a certain family member, a particular kind of criticism. Planning your response in advance makes the in-the-moment pause easier." },
  { id: 's10_q10', type: 'input', text: "What's one phrase or question you could use as your personal spot-check trigger?", context: "A short, memorable question (\"what's the resentment doing for me right now?\") can interrupt a reaction fast enough to change the outcome." },
  // Section 3: Keeping the Side of the Street Clean
  { id: 's10_q11', type: 'input', text: "What does \"promptly admitted it\" mean to you in practice - same day, same hour?", context: "The word \"promptly\" matters. Waiting days or weeks to admit a wrong lets resentment and rationalization build up in the meantime." },
  { id: 's10_q12', type: 'input', text: "Who do you owe a quick, honest admission to right now, from something recent?", context: "Small, prompt corrections - \"I was short with you earlier, I'm sorry\" - prevent the accumulation of the kind of wreckage that led to Step 8 and 9 in the first place." },
  { id: 's10_q13', type: 'input', text: "What's harder for you - admitting a wrong to yourself privately, or admitting it out loud to the other person?", context: "Both matter, but many people find the second significantly harder. Building comfort with quick, low-stakes verbal admissions makes bigger ones easier later." },
  { id: 's10_q14', type: 'input', text: "What's one relationship where practicing prompt admission consistently would change the whole dynamic?", context: "Relationships often shift meaningfully once the other person can trust that you'll own mistakes quickly, rather than needing to be confronted." },
  { id: 's10_q15', type: 'input', text: "What would it look like to treat \"keeping your side of the street clean\" as a daily practice rather than a crisis response?", context: "This step works best as routine maintenance, not emergency repair - a small daily habit that prevents the kind of major wreckage the earlier steps had to clean up." },
];

// -- STEP 11 (Fully Populated) --
const step11Questions: Question[] = [
  {
    id: 's11_intro',
    type: 'read_only',
    text: `Step 11: "Sought through prayer and meditation to improve our conscious contact with God as we understood Him, praying only for knowledge of His will for us and the power to carry that out."\n\nIntroduction:\nStep 11 asks us to keep building the relationship with a Higher Power that Steps 2 and 3 began. Through prayer and meditation, in whatever form fits your own understanding, we look for direction and the strength to actually follow it.`
  },
  // Section 1: Prayer (Talking) vs Meditation (Listening)
  { id: 's11_q1', type: 'input', text: "What does prayer look like for you right now - words, a list, a simple request for help?", context: "Prayer here is often described simply as talking to whatever you understand your Higher Power to be. There's no required script - honesty matters more than form." },
  { id: 's11_q2', type: 'input', text: "What does meditation - or simply quiet, undistracted stillness - look like in your current routine, if anything?", context: "Meditation is often framed as the listening half of this step, giving space for guidance to surface instead of only asking and talking." },
  { id: 's11_q3', type: 'input', text: "What's harder for you right now - the talking (prayer) or the listening (meditation)?", context: "Most people find one side of this pair more natural than the other. Noticing which one you avoid tells you where to practice." },
  { id: 's11_q4', type: 'input', text: "What gets in the way of a few minutes of quiet each day?", context: "Busyness and discomfort with silence are common obstacles. Many people in early recovery find stillness uncomfortable simply because it's unfamiliar." },
  { id: 's11_q5', type: 'input', text: "What's one small, realistic way you could build even two minutes of quiet into today?", context: "This step doesn't require an elaborate practice. A short, consistent moment of quiet is more sustainable than an ambitious routine you abandon after a week." },
  // Section 2: Seeking Knowledge of His Will
  { id: 's11_q6', type: 'input', text: "What does \"His will\" mean to you, separate from any one religious tradition?", context: "This phrase is often understood broadly - as the next right action, or the choice that serves your recovery and the people around you, rather than a specific doctrine." },
  { id: 's11_q7', type: 'input', text: "In a recent decision, how did you try to figure out the \"right\" choice versus what you simply wanted?", context: "Seeking guidance in this step is partly about separating impulse from wisdom - pausing long enough to ask what actually serves your recovery, not just your immediate want." },
  { id: 's11_q8', type: 'input', text: "What would it feel like to genuinely not know the answer to something and sit with that uncertainty instead of forcing a decision?", context: "Seeking guidance often means tolerating not having an immediate answer, trusting that clarity develops with patience rather than pressure." },
  { id: 's11_q9', type: 'input', text: "Who or what in your life reliably points you toward wiser decisions when you're unsure?", context: "Guidance doesn't have to arrive only through solitary prayer - a sponsor, a trusted friend, or your recovery group often serve as a practical channel for it." },
  { id: 's11_q10', type: 'input', text: "What's one current decision where you'd like more clarity, and what would help you find it?", context: "Naming a specific open question, rather than a vague wish for \"guidance in general,\" makes this practice more concrete and useful." },
  // Section 3: The Power to Carry That Out
  { id: 's11_q11', type: 'input', text: "Where in your life do you already know the right next step but lack the will to actually take it?", context: "Knowing what to do and having the power to do it are two different problems. This step asks for help with both, not just the first." },
  { id: 's11_q12', type: 'input', text: "What has stopped you in the past from following through on something you knew was right?", context: "Fear, exhaustion, and old habits often derail good intentions. Naming your specific obstacle helps you ask for the right kind of help." },
  { id: 's11_q13', type: 'input', text: "What would it look like to ask for strength for just the next single action, rather than the whole overwhelming task?", context: "Asking for the power to carry out one next step is often more workable than asking for strength to complete an entire, intimidating project." },
  { id: 's11_q14', type: 'input', text: "What's one place where a daily practice of prayer and meditation has already given you more follow-through than you had before?", context: "Many people notice this step working less as dramatic revelation and more as a gradual increase in steadiness and follow-through over weeks and months." },
  { id: 's11_q15', type: 'input', text: "What would consistent conscious contact look like for you a year from now?", context: "This step describes an ongoing relationship, not a box to check once. Imagining where it leads over time keeps the daily practice meaningful." },
];

// -- STEP 12 (Fully Populated from User Doc) --
const step12Questions: Question[] = [
  // Intro
  {
    id: 's12_intro',
    type: 'read_only',
    text: `Step 12: "Having had a spiritual awakening as the result of these steps, we tried to carry this message to addicts, and to practice these principles in all our affairs."\n\nIntroduction:\nStep 12 is the culmination of the program. It is about service, gratitude, and consistency. It asks us to take what we have been given—freedom—and share it with others, while living a life of integrity in all areas, not just recovery meetings.`
  },
  // Section 1: The Spiritual Awakening
  { id: 's12_q1', type: 'input', text: "How would you describe your spiritual awakening?", context: "An awakening can be a sudden \"white light\" experience or, more commonly, a slow educational variety. It is simply a personality change sufficient to bring about recovery." },
  { id: 's12_q2', type: 'input', text: "How are you different now compared to when you started Step 1?", context: "An awakening can be a sudden \"white light\" experience or, more commonly, a slow educational variety. It is simply a personality change sufficient to bring about recovery." },
  { id: 's12_q3', type: 'input', text: "What does \"emotional sobriety\" mean to you now?", context: "An awakening can be a sudden \"white light\" experience or, more commonly, a slow educational variety. It is simply a personality change sufficient to bring about recovery." },
  { id: 's12_q4', type: 'input', text: "Do you feel a sense of purpose that was missing before?", context: "An awakening can be a sudden \"white light\" experience or, more commonly, a slow educational variety. It is simply a personality change sufficient to bring about recovery." },
  { id: 's12_q5', type: 'input', text: "How do you define your spirituality today?", context: "An awakening can be a sudden \"white light\" experience or, more commonly, a slow educational variety. It is simply a personality change sufficient to bring about recovery." },

  // Section 2: Carrying the Message
  { id: 's12_q6', type: 'input', text: "How can you be of service to others in recovery?", context: "We help others not to be \"gurus,\" but to insure our own recovery. Sharing our experience, strength, and hope helps us remember where we came from." },
  { id: 's12_q7', type: 'input', text: "What is the difference between \"attraction\" and \"promotion\"?", context: "We help others not to be \"gurus,\" but to insure our own recovery. Sharing our experience, strength, and hope helps us remember where we came from." },
  { id: 's12_q8', type: 'input', text: "How do you handle it when someone you are trying to help doesn't want help?", context: "We help others not to be \"gurus,\" but to insure our own recovery. Sharing our experience, strength, and hope helps us remember where we came from." },
  { id: 's12_q9', type: 'input', text: "Why is working with others essential for your own sobriety?", context: "We help others not to be \"gurus,\" but to insure our own recovery. Sharing our experience, strength, and hope helps us remember where we came from." },
  { id: 's12_q10', type: 'input', text: "What is the \"message\" you are trying to carry?", context: "We help others not to be \"gurus,\" but to insure our own recovery. Sharing our experience, strength, and hope helps us remember where we came from." },

  // Section 3: Practicing Principles in All Affairs
  { id: 's12_q11', type: 'input', text: "How do you apply the steps in your workplace or school?", context: "We are not just \"sober\" people; we are people of integrity. We bring patience to our families, honesty to our jobs, and kindness to strangers." },
  { id: 's12_q12', type: 'input', text: "How do you practice these principles in your romantic relationships?", context: "We are not just \"sober\" people; we are people of integrity. We bring patience to our families, honesty to our jobs, and kindness to strangers." },
  { id: 's12_q13', type: 'input', text: "What does it mean to be a \"good citizen\" in the context of Step 12?", context: "We are not just \"sober\" people; we are people of integrity. We bring patience to our families, honesty to our jobs, and kindness to strangers." },
  { id: 's12_q14', type: 'input', text: "How do you handle success or failure using spiritual principles?", context: "We are not just \"sober\" people; we are people of integrity. We bring patience to our families, honesty to our jobs, and kindness to strangers." },
  { id: 's12_q15', type: 'input', text: "Are you ready to continue this way of life, one day at a time?", context: "We are not just \"sober\" people; we are people of integrity. We bring patience to our families, honesty to our jobs, and kindness to strangers." },
];

const twelveStepSections: WorkbookSection[] = [
  { id: 'step_1', title: 'Step 1', description: 'Powerlessness & Unmanageability', questions: step1Questions },
  { id: 'step_2', title: 'Step 2', description: 'Came to believe', questions: step2Questions },
  { id: 'step_3', title: 'Step 3', description: 'Turning it over', questions: step3Questions },
  { id: 'step_4', title: 'Step 4', description: 'Moral inventory', questions: step4Questions },
  { id: 'step_5', title: 'Step 5', description: 'Admitting our wrongs', questions: step5Questions },
  { id: 'step_6', title: 'Step 6', description: 'Entirely ready', questions: step6Questions },
  { id: 'step_7', title: 'Step 7', description: 'Humbly asked Him', questions: step7Questions },
  { id: 'step_8', title: 'Step 8', description: 'List of harms', questions: step8Questions },
  { id: 'step_9', title: 'Step 9', description: 'Making amends', questions: step9Questions },
  { id: 'step_10', title: 'Step 10', description: 'Personal inventory', questions: step10Questions },
  { id: 'step_11', title: 'Step 11', description: 'Conscious contact', questions: step11Questions },
  { id: 'step_12', title: 'Step 12', description: 'Spiritual awakening', questions: step12Questions },
];

// --- 3. RECOVERY DHARMA WORKBOOK (The Four Noble Truths) ---

// 1. First Noble Truth
const dharmaTruth1: Question[] = [
  { 
    id: 'rd_t1_intro', 
    type: 'read_only', 
    text: `The First Noble Truth is not a pessimistic claim that "life is miserable." rather, it is a realistic assessment that dissatisfaction, stress, and pain are part of the human experience.\n\nIn the context of addiction, this truth is the acknowledgment of our struggle. It is the realization that our compulsive behaviors—whether to substances, people, or processes—have become a source of suffering rather than a solution to it.\n\nWe admit that despite our best efforts to control it, the cycle has become unmanageable and painful.` 
  },
  { 
    id: 'rd_t1_q1', 
    type: 'input',
    text: "In what specific ways has my main coping mechanism (my addiction) stopped working for me?", 
    context: "We acknowledge that the things we used to cope with our pain have turned on us. What once provided relief now creates more suffering." 
  },
  { 
    id: 'rd_t1_q2', 
    type: 'input',
    text: "Can I identify the difference between 'pain' (the inevitable events of life) and 'suffering' (my reaction and resistance to those events)?", 
    context: "Pain is inevitable; suffering is optional. We suffer when we cling to how we want things to be, rather than accepting how they are." 
  },
  { 
    id: 'rd_t1_q3', 
    type: 'input',
    text: "Where in my body do I feel the physical sensation of 'unsatisfactoriness' or restlessness when I am not using/acting out?", 
    context: "Mindfulness begins with the body. The First Truth asks us to turn toward the discomfort we have been running from, rather than away from it." 
  },
  { 
    id: 'rd_t1_q4', 
    type: 'input',
    text: "How has my refusal to accept the reality of my situation prolonged my cycle of addiction?", 
    context: "Denial is a form of protection, but eventually, it becomes a prison. Acceptance is the first step toward unlocking the door." 
  },
  { 
    id: 'rd_t1_q5', 
    type: 'input',
    text: "Looking back, can I see how my 'solution' eventually became the primary problem in my life?", 
    context: "We realize that we have been trying to fill a spiritual void with material things, substances, or validation, and it simply does not work." 
  }
];

// 2. Second Noble Truth
const dharmaTruth2: Question[] = [
  { 
    id: 'rd_t2_intro', 
    type: 'read_only', 
    text: `The Second Truth teaches us that the root cause of our suffering is craving (thirst) and clinging.\n\nIt isn't just the drugs, the alcohol, or the behavior that is the problem; it is the underlying drive to fix the way we feel instantly. It is the deep-seated belief that "this moment is not enough" and that we need something external to make us whole.\n\nWe suffer because we cling to pleasure and push away pain, creating a constant tug-of-war in our minds.` 
  },
  { 
    id: 'rd_t2_q1', 
    type: 'input',
    text: "What is the specific feeling or emotion I am usually trying to escape when the craving arises?", 
    context: "Craving often arises as a response to an underlying discomfort—loneliness, fear, boredom, or shame. We use addiction to numb these feelings." 
  },
  { 
    id: 'rd_t2_q2', 
    type: 'input',
    text: "Can I identify a time recently when I clung to a pleasant experience so tightly that I ruined it when it naturally ended?", 
    context: "Impermanence is a law of nature. Suffering arises when we demand that temporary pleasure lasts forever." 
  },
  { 
    id: 'rd_t2_q3', 
    type: 'input',
    text: "What \"stories\" does my mind tell me about what will happen if I don't give in to the craving?", 
    context: "The mind creates catastrophic narratives to justify acting on impulse. We learn to observe these thoughts without believing them." 
  },
  { 
    id: 'rd_t2_q4', 
    type: 'input',
    text: "How does my attachment to a specific identity (e.g., 'the victim,' 'the addict,' 'the tough one') keep me stuck in old patterns?", 
    context: "We often cling to our suffering because it is familiar. Letting go of who we think we are allows us to become who we can be." 
  },
  { 
    id: 'rd_t2_q5', 
    type: 'input',
    text: "In what ways do I demand that the world conform to my expectations, and how does that lead to anger or resentment?", 
    context: "Expectations are resentments waiting to happen. When we stop fighting reality, the craving to escape reality diminishes." 
  }
];

// 3. Third Noble Truth
const dharmaTruth3: Question[] = [
  { 
    id: 'rd_t3_intro', 
    type: 'read_only', 
    text: `The Third Truth is the good news: Recovery is possible.\n\nSuffering is not permanent, and because it has a cause (craving), it can end. This is the truth of Cessation. It doesn’t mean we will never feel pain again, but it means we don't have to be enslaved by our reactions to it.\n\nWe can find a freedom that isn't dependent on external circumstances. We can experience peace right now, even in the midst of difficulty, by letting go of the demand for things to be different.` 
  },
  { 
    id: 'rd_t3_q1', 
    type: 'input',
    text: "Can I recall a moment in my recovery (or life) where I felt a sense of peace without needing to change anything?", 
    context: "Freedom is available in any moment where we stop fighting. This is the glimpse of Nirvana—the cooling of the flames of desire." 
  },
  { 
    id: 'rd_t3_q2', 
    type: 'input',
    text: "What would my life look like if I believed, truly, that I am already 'whole' and don't need to be 'fixed'?", 
    context: "Our true nature is wise and compassionate. Recovery is not about building a new you, but uncovering the you that was there all along." 
  },
  { 
    id: 'rd_t3_q3', 
    type: 'input',
    text: "If I let go of the need to control the outcome of my current situation, what specific burden would be lifted off my shoulders?", 
    context: "Surrender is not giving up; it is giving over. We let go of the illusion of control and find safety in the present moment." 
  },
  { 
    id: 'rd_t3_q4', 
    type: 'input',
    text: "How does the idea of 'impermanence' give me hope regarding my current struggles or cravings?", 
    context: "This too shall pass. Knowing that cravings are like weather—storms that come and go—helps us ride them out without drowning." 
  },
  { 
    id: 'rd_t3_q5', 
    type: 'input',
    text: "Who in my life (or in my Sangha/community) represents the possibility of freedom to me, and what qualities do they embody?", 
    context: "We take refuge in the Sangha. Seeing the recovery of others proves that the Third Noble Truth is a reality, not just a theory." 
  }
];

// 4. Fourth Noble Truth
const dharmaTruth4: Question[] = [
  { 
    id: 'rd_t4_intro', 
    type: 'read_only', 
    text: `The Fourth Truth is the Eightfold Path—the practical "how-to" guide for recovery.\n\nIt is a set of practices that helps us live ethically, train our minds, and cultivate wisdom. It covers Wisdom (Right View, Intention), Ethics (Right Speech, Action, Livelihood), and Meditation (Right Effort, Mindfulness, Concentration).\n\nThis is not a linear set of steps but a wheel of practice where each part supports the others. It is the daily discipline of recovery.` 
  },
  { 
    id: 'rd_t4_q1', 
    type: 'input',
    text: "Right Intention: Am I approaching my recovery today with an intention of kindness toward myself, or am I being harsh and critical?", 
    context: "Renunciation is not about punishment; it is an act of love. We let go of harmful behaviors because we care about our own well-being." 
  },
  { 
    id: 'rd_t4_q2', 
    type: 'input',
    text: "Right Speech: How have I used my words (to others or myself) to cause harm recently, and how can I practice honesty without cruelty?", 
    context: "Truthfulness is the foundation of trust. We cannot recover while hiding behind lies, but our truth must be spoken with compassion." 
  },
  { 
    id: 'rd_t4_q3', 
    type: 'input',
    text: "Right Action: What is one small, ethical action I can take today that aligns with the person I want to become?", 
    context: "Recovery is lived in the small moments. Every time we choose not to harm, we are strengthening our path to freedom." 
  },
  { 
    id: 'rd_t4_q4', 
    type: 'input',
    text: "Right Mindfulness: specific situations trigger me to go on 'autopilot,' and how can I bring more awareness to those moments?", 
    context: "Mindfulness is the pause between the trigger and the reaction. In that pause lies our freedom to choose a different response." 
  },
  { 
    id: 'rd_t4_q5', 
    type: 'input',
    text: "Right Effort: Am I striving too hard (restlessness) or not hard enough (complacency)? How can I find the 'Middle Way' in my recovery today?", 
    context: "The Middle Way is the path of balance. We avoid the extremes of indulgence and severe asceticism. We practice with gentle persistence." 
  }
];

// -- The Eightfold Path --

const eightfoldPart1: Question[] = [
  // 1. Right View
  { 
    id: 'rd_path_right_view_intro', 
    type: 'read_only', 
    text: `1. Right View (Understanding)\n\nRight View is the beginning of the path. In recovery, it means understanding the law of Karma (Cause and Effect). It is the deep realization that our actions have consequences.\n\nIt is accepting that unskillful actions (addiction) lead to suffering, and skillful actions (recovery) lead to freedom. It is seeing things as they truly are—impermanent and interconnected—rather than how our addiction wants us to see them.` 
  },
  {
    id: 'rd_path_q1',
    type: 'input',
    text: "Do I truly accept that I am the owner of my actions and their consequences, without blaming others or my circumstances?",
    context: "We stop looking for a scapegoat. When we realize that our choices shape our reality, we reclaim the power to change that reality."
  },
  {
    id: 'rd_path_q2',
    type: 'input',
    text: "Can I see the cycle of 'cause and effect' in my last relapse or emotional outburst? What specific belief led to that action?",
    context: "Ignorance is the root of suffering. When we see the link between our beliefs and our pain, we can begin to break the chain."
  },
  {
    id: 'rd_path_q3',
    type: 'input',
    text: "How does viewing my thoughts as 'impermanent weather' change the way I react to a strong craving?",
    context: "Right View teaches us that no feeling is final. We don't have to obey a command that will disappear in ten minutes."
  },
  // 2. Right Intention
  { 
    id: 'rd_path_right_intention_intro', 
    type: 'read_only', 
    text: `2. Right Intention (Wise Resolve)\n\nIf Right View is the map, Right Intention is the steering wheel. It involves three specific resolves: Renunciation (letting go of craving), Good Will (loving-kindness), and Harmlessness (compassion).\n\nIt is the commitment to move away from cruelty and toward kindness, for ourselves and others.` 
  },
  {
    id: 'rd_path_q4',
    type: 'input',
    text: "Am I viewing 'renunciation' (giving up my addiction) as a punishment, or as a liberating gift I am giving myself?",
    context: "Renunciation is not deprivation. It is the joyous letting go of a heavy burden we have been carrying for too long."
  },
  {
    id: 'rd_path_q5',
    type: 'input',
    text: "In what situation today can I replace a thought of judgment (ill will) with a thought of understanding (good will)?",
    context: "We cannot hate ourselves into recovery. Intention shifts our internal dialogue from a prosecutor to a gentle guide."
  },
  {
    id: 'rd_path_q6',
    type: 'input',
    text: "How can I practice 'harmlessness' toward my own body today, considering the damage I may have done in the past?",
    context: "Compassion starts at home. Treating our bodies with respect is a direct act of defiance against the self-destruction of addiction."
  }
];

const eightfoldPart2: Question[] = [
  // 3. Right Speech
  { 
    id: 'rd_path_right_speech_intro', 
    type: 'read_only', 
    text: `3. Right Speech\n\nWords have power. Right Speech means abstaining from lying, divisive speech (gossip/talking behind backs), harsh/abusive speech, and idle chatter (mindless talking to avoid feelings).\n\nIn recovery, this is synonymous with "getting honest." We stop hiding behind deceptions and learn to speak our truth with care.` 
  },
  {
    id: 'rd_path_q7',
    type: 'input',
    text: "Is there a specific lie or half-truth I am currently protecting? What fear creates the need for this lie?",
    context: "Secrets keep us sick. Rigorous honesty is the antidote to the isolation of addiction."
  },
  {
    id: 'rd_path_q8',
    type: 'input',
    text: "How do you speak to myself? Is my internal monologue harsh and abusive? How can I apply Right Speech internally?",
    context: "If we spoke to our friends the way we speak to ourselves, we would have no friends. Mindfulness catches the inner critic in the act."
  },
  {
    id: 'rd_path_q9',
    type: 'input',
    text: "Can I practice 'noble silence' today—listening more than I speak—to avoid the trap of idle chatter or gossip?",
    context: "Silence allows us to hear the truth. Sometimes the most skillful thing to say is nothing at all."
  },
  // 4. Right Action
  { 
    id: 'rd_path_right_action_intro', 
    type: 'read_only', 
    text: `4. Right Action\n\nThis factor corresponds to the Five Precepts: refraining from killing/harming, stealing, sexual misconduct, lying, and intoxication. Right Action is about living in a way that does not cause regret.\n\nIt creates a foundation of safety and trust in our lives.` 
  },
  {
    id: 'rd_path_q10',
    type: 'input',
    text: "Looking at the precept of 'not taking what is not given' (stealing), are there subtle ways I take things (time, energy, credit) from others?",
    context: "Generosity is the practice of letting go. We counter the taker mentality of addiction by asking, 'What can I give?'"
  },
  {
    id: 'rd_path_q11',
    type: 'input',
    text: "Regarding sexual misconduct/harm: Am I using relationships or sex to numb out, seek validation, or manipulate, rather than to connect?",
    context: "Intimacy requires presence. We learn to connect with others authentically, rather than using them as objects to fix our loneliness."
  },
  {
    id: 'rd_path_q12',
    type: 'input',
    text: "What is one ethical boundary I need to set today to protect my sobriety (e.g., not going to a certain place, not seeing a certain person)?",
    context: "Right Action is proactive. We don't just resist temptation; we build a life where temptation has no foothold."
  },
  // 5. Right Livelihood
  { 
    id: 'rd_path_right_livelihood_intro', 
    type: 'read_only', 
    text: `5. Right Livelihood\n\nWe spend a vast amount of our lives working. Right Livelihood asks us to earn our living in a way that doesn't violate our ethical principles or cause harm to others.\n\nIn a broader sense, it asks if our daily "hustle" supports our recovery or hinders it.` 
  },
  {
    id: 'rd_path_q13',
    type: 'input',
    text: "Does my current job or way of making money require me to compromise my integrity or values?",
    context: "Peace of mind is more valuable than a paycheck. We cannot maintain spiritual balance if we spend 40 hours a week violating our conscience."
  },
  {
    id: 'rd_path_q14',
    type: 'input',
    text: "How can I bring the spirit of service into my daily work, regardless of what my job title is?",
    context: "Every task can be a practice. When we work with mindfulness and care, our labor becomes an offering rather than a burden."
  },
  {
    id: 'rd_path_q15',
    type: 'input',
    text: "Am I using work as a new addiction (workaholism) to avoid facing other areas of my life?",
    context: "Balance is key. Right Livelihood supports life; it does not consume it."
  }
];

const eightfoldPart3: Question[] = [
  // 6. Right Effort
  { 
    id: 'rd_path_right_effort_intro', 
    type: 'read_only', 
    text: `6. Right Effort\n\nRight Effort is not about "white-knuckling" it. It is the balanced energy we apply to the practice.\n\nIt consists of four great efforts: (1) Preventing unwholesome states (cravings) from arising, (2) Abandoning unwholesome states that have arisen, (3) Cultivating wholesome states (joy, gratitude), and (4) Maintaining those wholesome states.` 
  },
  {
    id: 'rd_path_q16',
    type: 'input',
    text: "Am I trying too hard (perfectionism) or not hard enough (complacency)? Where is the 'Middle Way' for me right now?",
    context: "We tune the strings of our instrument not too tight, not too loose. Consistency beats intensity."
  },
  {
    id: 'rd_path_q17',
    type: 'input',
    text: "When a negative state arises (anger/fear), do I feed it with more thought, or do I apply the effort to let it go?",
    context: "What we water grows. Right Effort is the choice to stop watering the weeds and start watering the flowers."
  },
  {
    id: 'rd_path_q18',
    type: 'input',
    text: "What is one positive quality (e.g., patience, generosity) I want to actively cultivate and strengthen this week?",
    context: "Recovery is not just removing the bad; it is actively building the good. We fill the void with light."
  },
  // 7. Right Mindfulness
  { 
    id: 'rd_path_right_mindfulness_intro', 
    type: 'read_only', 
    text: `7. Right Mindfulness\n\nMindfulness is the core of the practice. It is the ability to see clearly what is happening right now.\n\nIt is the "Four Foundations of Mindfulness": Awareness of the body, feelings (pleasant/unpleasant/neutral), mind states (emotions), and phenomena (reality). It prevents us from living on autopilot.` 
  },
  {
    id: 'rd_path_q19',
    type: 'input',
    text: "Can I detect the physical warning signs of a resentment or craving before it becomes a mental obsession?",
    context: "The body always knows first. Mindfulness allows us to catch the spark before it becomes a forest fire."
  },
  {
    id: 'rd_path_q20',
    type: 'input',
    text: "Am I able to observe an uncomfortable emotion (like anxiety) without judging it as 'bad' or trying to fix it immediately?",
    context: "This is the practice of 'being with.' We learn to surf the waves of emotion rather than drowning in them."
  },
  {
    id: 'rd_path_q21',
    type: 'input',
    text: "How often during the day do I actually 'arrive' in the present moment, rather than living in the past or future?",
    context: "Life only happens now. When we are present, we are safe, because in this exact second, we are okay."
  },
  // 8. Right Concentration
  { 
    id: 'rd_path_right_concentration_intro', 
    type: 'read_only', 
    text: `8. Right Concentration\n\nWhile Mindfulness is broad awareness, Concentration is focused awareness. It is the ability to rest the mind on a single object (like the breath or a mantra).\n\nThis steadiness brings a deep sense of calm and joy, giving us a sanctuary from the chaos of the addicted mind.` 
  },
  {
    id: 'rd_path_q22',
    type: 'input',
    text: "When I sit to meditate, can I treat my wandering mind with gentleness, simply returning to the breath without self-criticism?",
    context: "The 'return' is the practice. Every time we realize we drifted and come back, we are strengthening the muscle of concentration."
  },
  {
    id: 'rd_path_q23',
    type: 'input',
    text: "How does the ability to focus on one thing help me when I am overwhelmed by life's problems?",
    context: "A scattered mind is a stressed mind. Concentration gathers our energy so we can face difficulties with stability."
  },
  {
    id: 'rd_path_q24',
    type: 'input',
    text: "Do I use distractions (phone, TV, food) to prevent myself from ever being truly quiet? What specific fear makes me avoid the silence?",
    context: "In the silence, we meet ourselves. We learn that we don't need constant noise to be okay."
  }
];

const dharmaSections: WorkbookSection[] = [
  { id: 'rd_truth_1', title: 'First Noble Truth', description: 'There is suffering', questions: dharmaTruth1 },
  { id: 'rd_truth_2', title: 'Second Noble Truth', description: 'The cause of suffering', questions: dharmaTruth2 },
  { id: 'rd_truth_3', title: 'Third Noble Truth', description: 'The end of suffering', questions: dharmaTruth3 },
  { id: 'rd_truth_4', title: 'Fourth Noble Truth', description: 'The path', questions: dharmaTruth4 },
  { id: 'rd_path_1', title: 'Part I: Wisdom', description: 'Right View & Right Intention', questions: eightfoldPart1 },
  { id: 'rd_path_2', title: 'Part II: Ethics', description: 'Right Speech, Action, & Livelihood', questions: eightfoldPart2 },
  { id: 'rd_path_3', title: 'Part III: Discipline', description: 'Right Effort, Mindfulness, & Concentration', questions: eightfoldPart3 },
];

// --- 4. WOMEN FOR RECOVERY WORKBOOK ---
const womensRecoverySections: WorkbookSection[] = [
  {
    id: 'wr_intro',
    title: 'Introduction',
    description: 'Welcome to your recovery journey.',
    questions: [
      {
        id: 'wr_intro_1',
        type: 'read_only',
        text: `Welcome to your recovery journey. This workbook is designed to guide you through a process of self-discovery, emotional awareness, and intentional growth as you build a foundation for lasting change. Take these sections at your own pace, and remember to approach your answers with honesty and self-compassion.`
      }
    ]
  },
  {
    id: 'wr_s1',
    title: 'Section 1: Awareness - Breaking the Pattern',
    description: 'Observe your behaviors without judgment.',
    questions: [
      {
        id: 'wr_s1_intro',
        type: 'read_only',
        text: 'This section helps you slow down and observe your behaviors without judgment. Awareness is the first step in change-before anything can shift, it must be seen clearly.'
      },
      { id: 'wr_s1_q1', type: 'input', text: 'Describe a recent moment when you felt the urge to use. What happened just before, during, and after?' },
      { id: 'wr_s1_q2', type: 'input', text: 'What emotions tend to show up right before you feel the urge? Trace them as far back as you can.' },
      { id: 'wr_s1_q3', type: 'input', text: 'What are you truly seeking in those moments (relief, escape, connection, numbness)?' },
      { id: 'wr_s1_q4', type: 'input', text: 'If your urge could speak, what would it say to you?' }
    ]
  },
  {
    id: 'wr_s2',
    title: 'Section 2: Self-Image Reset',
    description: 'Reshape how you see yourself at your core.',
    questions: [
      {
        id: 'wr_s2_intro',
        type: 'read_only',
        text: 'Recovery is not just about stopping a behavior-it\'s about becoming someone new. This section focuses on reshaping how you see yourself at your core.'
      },
      { id: 'wr_s2_q1', type: 'input', text: 'Write down the beliefs you currently hold about yourself. Where did each belief originate?' },
      { id: 'wr_s2_q2', type: 'input', text: 'Which of these beliefs feel inherited rather than chosen?' },
      { id: 'wr_s2_q3', type: 'input', text: 'Describe the version of you that exists beyond addiction. What does she believe about herself?' },
      { id: 'wr_s2_q4', type: 'input', text: 'Write a new identity statement beginning with: \'I am a woman who...\'' }
    ]
  },
  {
    id: 'wr_s3',
    title: 'Section 3: Emotional Patterns',
    description: 'Explore your emotional world and how it shapes your actions.',
    questions: [
      {
        id: 'wr_s3_intro',
        type: 'read_only',
        text: 'Many behaviors are rooted in emotions we haven\'t learned to process. This section explores your emotional world and how it shapes your actions.'
      },
      { id: 'wr_s3_q1', type: 'input', text: 'Which emotions do you avoid the most? What happens when you try to feel them?' },
      { id: 'wr_s3_q2', type: 'input', text: 'Recall a childhood or early memory connected to one of these emotions.' },
      { id: 'wr_s3_q3', type: 'input', text: 'How do your current coping strategies protect you? How do they limit you?' },
      { id: 'wr_s3_q4', type: 'input', text: 'What would it look like to sit with discomfort instead of escaping it?' }
    ]
  },
  {
    id: 'wr_s4',
    title: 'Section 4: Thought Rewiring',
    description: 'Identify and gently challenge the patterns that keep you stuck.',
    questions: [
      {
        id: 'wr_s4_intro',
        type: 'read_only',
        text: 'Your thoughts shape your reality. This section helps you identify and gently challenge the patterns that keep you stuck, replacing them with more supportive beliefs.'
      },
      { id: 'wr_s4_q1', type: 'input', text: 'Identify three recurring negative thoughts. When do they appear?' },
      { id: 'wr_s4_q2', type: 'input', text: 'For each thought, ask: Is this absolutely true? What evidence contradicts it?' },
      { id: 'wr_s4_q3', type: 'input', text: 'Rewrite each thought into something both compassionate and realistic.' },
      { id: 'wr_s4_q4', type: 'input', text: 'How does your body feel when you believe the old thought vs the new one?' }
    ]
  },
  {
    id: 'wr_s5',
    title: 'Section 5: Daily Practices',
    description: 'Build daily habits that reinforce your new identity.',
    questions: [
      {
        id: 'wr_s5_intro',
        type: 'read_only',
        text: 'Lasting change comes from small, consistent actions. This section focuses on building daily habits that reinforce your new identity.'
      },
      { id: 'wr_s5_q1', type: 'input', text: 'What small daily action would move you toward the person you want to become?' },
      { id: 'wr_s5_q2', type: 'input', text: 'At the end of each day, list three things you did well, no matter how small.' },
      { id: 'wr_s5_q3', type: 'input', text: 'Track your emotional state daily. What patterns do you begin to notice?' },
      { id: 'wr_s5_q4', type: 'input', text: 'What does consistency mean to you, and where do you struggle with it?' }
    ]
  },
  {
    id: 'wr_s6',
    title: 'Section 6: Relationships & Boundaries',
    description: 'Understand where you need protection, clarity, and change.',
    questions: [
      {
        id: 'wr_s6_intro',
        type: 'read_only',
        text: 'Your environment and relationships deeply influence your recovery. This section helps you understand where you need protection, clarity, and change.'
      },
      { id: 'wr_s6_q1', type: 'input', text: 'List the relationships in your life. Which feel energizing vs draining?' },
      { id: 'wr_s6_q2', type: 'input', text: 'Where do you say yes when you mean no? What are you afraid would happen if you said no?' },
      { id: 'wr_s6_q3', type: 'input', text: 'Describe a recent interaction where you abandoned your own needs.' },
      { id: 'wr_s6_q4', type: 'input', text: 'What is one boundary you can begin practicing this week?' }
    ]
  },
  {
    id: 'wr_s7',
    title: 'Section 7: Future Self',
    description: 'Define and connect with the person you are becoming.',
    questions: [
      {
        id: 'wr_s7_intro',
        type: 'read_only',
        text: 'Recovery becomes stronger when you are moving toward something meaningful. This section helps you define and connect with the person you are becoming.'
      },
      { id: 'wr_s7_q1', type: 'input', text: 'Imagine your life one year from now in recovery. Describe it in detail.' },
      { id: 'wr_s7_q2', type: 'input', text: 'What qualities does your future self embody? What habits does she practice daily?' },
      { id: 'wr_s7_q3', type: 'input', text: 'What would make your future self proud of you today?' }
    ]
  },
  {
    id: 'wr_s8',
    title: 'Section 8: Overdose & Survival Reframe',
    description: 'Build resilience and self-compassion after a severe setback.',
    questions: [
      {
        id: 'wr_s8_intro',
        type: 'read_only',
        text: 'Setbacks can become powerful teachers when approached with curiosity instead of shame. This section helps you build resilience and self-compassion.'
      },
      { id: 'wr_s8_q1', type: 'input', text: 'If you\'ve experienced an overdose, what did it teach you about your needs or vulnerabilities?' },
      { id: 'wr_s8_q2', type: 'input', text: 'What warning signs did you notice beforehand?' },
      { id: 'wr_s8_q3', type: 'input', text: 'How can you respond with compassion instead of self-judgment?' },
      { id: 'wr_s8_q4', type: 'input', text: 'Who will you reach out to, or what coping tool will you lean on, the next time you feel at risk?' }
    ]
  }
];

// --- MASTER REGISTRY ---
export const WORKBOOKS: Workbook[] = [
  {
    id: 'general_recovery',
    title: 'General Recovery Workbook',
    description: 'A comprehensive 25-question guide to explore the foundations of your recovery journey.',
    type: 'general',
    sections: [{ id: 'main', title: 'Core Questions', questions: generalQuestions }]
  },
  {
    id: '12_steps',
    title: '12-Step Workbook',
    description: 'A comprehensive 12-Step program. Each step includes an introduction and 3 guided sections.',
    type: 'steps',
    sections: twelveStepSections
  },
  {
    id: 'recovery_dharma',
    title: 'Recovery Dharma',
    description: 'Buddhist-inspired path to recovery focusing on the Four Noble Truths and Eightfold Path.',
    type: 'steps',
    sections: dharmaSections
  },
  {
    id: 'womens_recovery',
    title: 'Women for Recovery Workbook',
    description: 'A guided process of self-discovery, emotional awareness, and intentional growth as you build a foundation for lasting change.',
    type: 'specialty',
    sections: womensRecoverySections
  }
];

export function getWorkbook(id: string): Workbook | undefined {
  return WORKBOOKS.find(w => w.id === id);
}

// PROJ-75 (Workbook Marketplace): default "My Workbooks" library for legacy
// users (no installedWorkbookIds field yet) and brand-new signups — everyone
// starts with the full official catalog installed, matching pre-marketplace
// behavior, and can remove workbooks from the Marketplace tab afterward.
export function getDefaultInstalledWorkbookIds(): string[] {
  return WORKBOOKS.map(w => w.id);
}