// src/data/workbooks.ts

export interface Question {
  id: string;
  text: string;
  context?: string; // Optional context/quote from literature (The Insight)
  type?: 'input' | 'read_only'; // Defaults to 'input' if undefined
}

export interface WorkbookSection {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
}

export interface Workbook {
  id: string;
  title: string;
  description: string;
  type: 'linear' | 'steps' | 'general';
  sections: WorkbookSection[];
}

// Helper to generate generic questions for sections we don't fully populate in this snippet
//const generateQuestions = (count: number, prefix: string): Question[] => {
//  return Array.from({ length: count }).map((_, i) => ({
//    id: `${prefix}_q${i + 1}`,
//    text: `Question ${i + 1}: Reflection point regarding ${prefix.replace(/_/g, ' ')}.`,
//    type: 'input'
//  }));
//};

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

// Helper to build the 16-slide structure for Steps 2-11 (Standardized Template)
const createStepStructure = (
  stepNum: number,
  introText: string,
  insight1: string,
  insight2: string,
  insight3: string
): Question[] => {
  const q: Question[] = [];
  
  // 1. Intro Slide
  q.push({
    id: `s${stepNum}_intro`,
    type: 'read_only',
    text: introText
  });

  // 2. Section 1 (5 Qs)
  for (let i = 1; i <= 5; i++) {
    q.push({
      id: `s${stepNum}_q${i}`,
      type: 'input',
      text: `Step ${stepNum} Reflection Q${i}: How does the concept of this section apply to your life today?`,
      context: insight1
    });
  }

  // 3. Section 2 (5 Qs)
  for (let i = 6; i <= 10; i++) {
    q.push({
      id: `s${stepNum}_q${i}`,
      type: 'input',
      text: `Step ${stepNum} Reflection Q${i}: What barriers do you face regarding this principle?`,
      context: insight2
    });
  }

  // 4. Section 3 (5 Qs)
  for (let i = 11; i <= 15; i++) {
    q.push({
      id: `s${stepNum}_q${i}`,
      type: 'input',
      text: `Step ${stepNum} Reflection Q${i}: How can you put this into practice immediately?`,
      context: insight3
    });
  }

  return q;
};

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

// -- STEPS 2-11 (Generated Structure - Ready for Text Content) --
const step2Questions = createStepStructure(2, "Step 2: Came to believe that a Power greater than ourselves could restore us to sanity.", "Sanity vs Insanity in addiction.", "Defining a Higher Power.", "The process of coming to believe.");
const step3Questions = createStepStructure(3, "Step 3: Made a decision to turn our will and our lives over to the care of God as we understood Him.", "The decision vs the action.", "Letting go of self-will.", "Moving from fear to faith.");
const step4Questions = createStepStructure(4, "Step 4: Made a searching and fearless moral inventory of ourselves.", "The purpose of inventory.", "Resentments and fears.", "Assets and liabilities.");
const step5Questions = createStepStructure(5, "Step 5: Admitted to God, to ourselves, and to another human being the exact nature of our wrongs.", "The value of confession.", "Overcoming shame.", "Building trust.");
const step6Questions = createStepStructure(6, "Step 6: Were entirely ready to have God remove all these defects of character.", "The difference between Step 6 and 7.", "Becoming ready.", "Letting go of old survival mechanisms.");
const step7Questions = createStepStructure(7, "Step 7: Humbly asked Him to remove our shortcomings.", "Defining humility.", "The practice of asking.", "Changing our behavior.");
const step8Questions = createStepStructure(8, "Step 8: Made a list of all persons we had harmed, and became willing to make amends to them all.", "Identifying harm done.", "Willingness vs action.", "Forgiveness of self and others.");
const step9Questions = createStepStructure(9, "Step 9: Made direct amends to such people wherever possible, except when to do so would injure them or others.", "Direct amends vs apologies.", "Living amends.", "Cleaning up the wreckage.");
const step10Questions = createStepStructure(10, "Step 10: Continued to take personal inventory and when we were wrong promptly admitted it.", "Daily inventory practice.", "Spot-check inventory.", "Keeping the side of the street clean.");
const step11Questions = createStepStructure(11, "Step 11: Sought through prayer and meditation to improve our conscious contact with God...", "Prayer (talking) vs Meditation (listening).", "Seeking knowledge of His will.", "The power to carry that out.");

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
  }
];

export function getWorkbook(id: string): Workbook | undefined {
  return WORKBOOKS.find(w => w.id === id);
}