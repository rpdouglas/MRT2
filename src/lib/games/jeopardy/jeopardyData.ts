// src/lib/games/jeopardy/jeopardyData.ts
// PROJ-72 (Recovery Games), Phase 3. Ported from the legacy "Recovery
// Jeopardy" game with a full trademark/compliance content scrub per
// docs/projects/72_RECOVERY_GAMES.md §4 (Tradition 6 compliance): no
// fellowship names, no branded program names, no verbatim literature
// quotes. Category names and questions are rewritten to test general
// recovery knowledge and concepts rather than any single fellowship's
// specific text — see the compliance guard test in
// src/lib/games/jeopardy/__tests__/jeopardyData.test.ts, which fails CI
// if any denylisted term slips back in.
import type { JeopardyData } from './types';

export const jeopardyData: JeopardyData = {
  categories: [
    {
      name: 'Foundational Principles',
      questions: [
        { question: 'The first foundational principle in many recovery programs is admitting we were completely this over our addiction.', answer: 'Powerless', value: 200 },
        { question: 'The second principle involves coming to believe in a source of strength greater than oneself.', answer: 'A Higher Power / greater strength', value: 400 },
        { question: 'A later principle is a decision to turn one’s will and life over to the care of this, as one understands it.', answer: 'A Higher Power', value: 600 },
        { question: 'The first principle deals with addiction and this, which makes life unmanageable.', answer: 'Unmanageability', value: 800 },
        { question: 'This kind of thinking is often defined as doing the same thing over and over, expecting different results.', answer: 'Insanity', value: 1000 },
      ],
    },
    {
      name: 'Recovery Slogans',
      questions: [
        { question: 'This 3-word slogan advises against over-complicating recovery.', answer: 'Keep It Simple', value: 200 },
        { question: 'This slogan encourages patience and not trying to fix everything at once.', answer: 'Easy Does It', value: 400 },
        { question: 'This slogan reminds us to focus on what’s immediately in front of us.', answer: 'One Day at a Time', value: 600 },
        { question: 'This phrase reminds us that recovery isn’t about being flawless.', answer: 'Progress, Not Perfection', value: 800 },
        { question: 'This acronym reminds us to pause before acting on impulse.', answer: 'Think Think Think', value: 1000 },
      ],
    },
    {
      name: 'Recovery Literature Basics',
      questions: [
        { question: 'Recovery literature often includes personal accounts from people in recovery, commonly called this.', answer: 'Stories / personal accounts', value: 200 },
        { question: 'Foundational recovery texts are often organized to explain both the problem and this.', answer: 'The solution / how the program works', value: 400 },
        { question: 'Many foundational recovery texts open with an outside expert’s perspective on addiction, often written by this kind of professional.', answer: 'A doctor / physician', value: 600 },
        { question: 'Many foundational recovery texts were first published in this decade.', answer: 'The 1930s', value: 800 },
        { question: 'Recovery literature meant to be read aloud and discussed as a group is often called this.', answer: 'Study / discussion literature', value: 1000 },
      ],
    },
    {
      name: 'Sponsorship',
      questions: [
        { question: 'A sponsor is often described as a guide through this.', answer: 'The recovery process', value: 200 },
        { question: 'This is the one-word ‘main requirement’ for being a sponsor.', answer: 'Sobriety / clean time', value: 400 },
        { question: 'It’s often suggested to find a sponsor who has this.', answer: 'What you want (e.g., peace, serenity)', value: 600 },
        { question: 'This is the person a sponsor sponsors.', answer: 'Sponsee', value: 800 },
        { question: 'A sponsor is not this; a role reserved for professionals.', answer: 'A therapist / counselor', value: 1000 },
      ],
    },
    {
      name: 'H.A.L.T.',
      questions: [
        { question: 'The ‘H’ in H.A.L.T. stands for this.', answer: 'Hungry', value: 200 },
        { question: 'The ‘A’ in H.A.L.T. stands for this.', answer: 'Angry', value: 400 },
        { question: 'The ‘L’ in H.A.L.T. stands for this.', answer: 'Lonely', value: 600 },
        { question: 'The ‘T’ in H.A.L.T. stands for this.', answer: 'Tired', value: 800 },
        { question: 'The purpose of H.A.L.T. is to recognize these common states.', answer: 'Triggers', value: 1000 },
      ],
    },
    {
      name: 'Recovery Fellowship Literature',
      questions: [
        { question: 'This term describes an organized group of peers supporting each other’s recovery.', answer: 'Fellowship', value: 200 },
        { question: 'Foundational fellowship literature is often collectively written and revised by its own members — this kind of authorship.', answer: 'Collective / peer-authored', value: 400 },
        { question: 'A common daily-reflection phrase used across many fellowships is ‘Just For...’', answer: 'Today', value: 600 },
        { question: 'Nearly all step-based fellowships share the same First Step concept: admitting powerlessness over this.', answer: 'One’s addiction', value: 800 },
        { question: 'Fellowship literature is often revised and updated over time through new versions of this.', answer: 'Editions', value: 1000 },
      ],
    },
    {
      name: 'Step Work: Honesty & Inventory',
      questions: [
        { question: 'This kind of self-examination is often described as ‘searching and fearless.’', answer: 'A moral inventory', value: 200 },
        { question: 'A key step involves admitting the exact nature of our wrongs to ourselves and this kind of person.', answer: 'Another human being', value: 400 },
        { question: 'This trusted guide is often the person we share our inventory with.', answer: 'A sponsor', value: 600 },
        { question: 'A moral inventory often surfaces these long-held negative feelings toward others.', answer: 'Resentments', value: 800 },
        { question: 'Naming the ‘exact nature of our wrongs’ really means identifying these recurring behavioral patterns.', answer: 'Character defects / patterns', value: 1000 },
      ],
    },
    {
      name: 'Step Work: Willingness & Humility',
      questions: [
        { question: 'This quality means becoming ready to let go of unhelpful behavior patterns.', answer: 'Willingness', value: 200 },
        { question: 'This step focuses on humbly asking for help removing our shortcomings.', answer: 'Humility / asking for help', value: 400 },
        { question: 'A pair of steps focused on readiness and humility are often grouped under this shared theme.', answer: 'Humility', value: 600 },
        { question: 'The positive trait that stands opposite a character defect.', answer: 'A principle / virtue', value: 800 },
        { question: 'Two sequential steps dealing with willingness and humbly asking for help are sometimes nicknamed this.', answer: 'The humility steps', value: 1000 },
      ],
    },
    {
      name: 'Step Work: Amends',
      questions: [
        { question: 'This step involves making a list of everyone we’ve caused harm to.', answer: 'Making a list of people harmed', value: 200 },
        { question: 'Making things right with people we’ve harmed is called making this.', answer: 'Amends', value: 400 },
        { question: 'Amends include one major exception: situations where doing so would cause this.', answer: 'Further injury or harm', value: 600 },
        { question: 'Making amends is meaningfully different from just doing this.', answer: 'Apologizing', value: 800 },
        { question: 'True amends require being willing to do this for everyone on the list, not just some.', answer: 'Make amends to all of them', value: 1000 },
      ],
    },
    {
      name: 'Step Work: Maintenance & Service',
      questions: [
        { question: 'This ongoing practice involves continuing to take stock of one’s own behavior.', answer: 'Personal inventory', value: 200 },
        { question: 'A later step involves deepening one’s connection to a source of strength through reflection and stillness.', answer: 'Prayer and meditation', value: 400 },
        { question: 'The result of working through a full set of recovery steps is often described as this kind of shift in perspective.', answer: 'A spiritual awakening', value: 600 },
        { question: 'The final few steps of many programs are often called this, since they’re about sustaining recovery.', answer: 'The maintenance steps', value: 800 },
        { question: 'The last step of many programs also involves helping others and living these principles daily.', answer: 'Carrying the message / living the principles', value: 1000 },
      ],
    },
    {
      name: 'Recovery Terms',
      questions: [
        { question: 'A return to using after a period of sobriety.', answer: 'Relapse', value: 200 },
        { question: 'A person, place, or thing that can lead to a craving.', answer: 'Trigger', value: 400 },
        { question: 'A common term for a sobriety anniversary in recovery groups.', answer: 'Birthday / Anniversary', value: 600 },
        { question: 'This term describes an intense desire to use.', answer: 'Craving', value: 800 },
        { question: 'This term refers to a period of time without using.', answer: 'Clean time', value: 1000 },
      ],
    },
    {
      name: 'Meetings',
      questions: [
        { question: 'A meeting where anyone can attend.', answer: 'Open meeting', value: 200 },
        { question: 'A meeting for those who identify as being in recovery only.', answer: 'Closed meeting', value: 400 },
        { question: 'This type of meeting features a single person sharing their story.', answer: 'Speaker meeting', value: 600 },
        { question: 'What’s passed around at meetings to voluntarily cover group expenses?', answer: 'A basket / collection', value: 800 },
        { question: 'Many meetings end with this short prayer, recited together in a circle.', answer: 'The Serenity Prayer', value: 1000 },
      ],
    },
    {
      name: 'Coping Skills',
      questions: [
        { question: 'This simple breathing technique involves a 4-second inhale, 4-second hold, and 4-second exhale.', answer: 'Box breathing', value: 200 },
        { question: 'This practice involves focusing on the present moment without judgment.', answer: 'Mindfulness', value: 400 },
        { question: 'This coping skill involves calling a sponsor or fellow person in recovery.', answer: 'Reaching out / using the phone', value: 600 },
        { question: 'This skill involves listing things you are thankful for.', answer: 'Gratitude list', value: 800 },
        { question: 'This technique involves mentally going to a safe, calm place.', answer: 'Visualization / guided imagery', value: 1000 },
      ],
    },
    {
      name: 'Triggers',
      questions: [
        { question: 'H.A.L.T. is an acronym for common... triggers.', answer: 'Internal / physical', value: 200 },
        { question: 'Seeing people or places associated with past use is this type of trigger.', answer: 'External', value: 400 },
        { question: 'Feeling sad, anxious, or overly happy can be this type of trigger.', answer: 'Emotional', value: 600 },
        { question: 'A relapse-prevention plan often focuses on avoiding certain people, and these two other things.', answer: 'Places and things', value: 800 },
        { question: 'The first step in dealing with a trigger.', answer: 'Recognizing it', value: 1000 },
      ],
    },
    {
      name: 'P.A.W.S.',
      questions: [
        { question: 'P.A.W.S. stands for Post-Acute... Syndrome.', answer: 'Withdrawal', value: 200 },
        { question: 'This common P.A.W.S. symptom involves difficulty thinking clearly.', answer: 'Brain fog / cognitive impairment', value: 400 },
        { question: 'P.A.W.S. symptoms often include trouble with this nightly restorative process.', answer: 'Sleep / insomnia', value: 600 },
        { question: 'P.A.W.S. symptoms can come and go in these.', answer: 'Waves / episodes', value: 800 },
        { question: 'Unlike acute withdrawal, P.A.W.S. can last for this extended period.', answer: 'Months or years', value: 1000 },
      ],
    },
    {
      name: 'Mindfulness & Buddhist-Inspired Recovery',
      questions: [
        { question: 'This practice, often focusing on the breath, is central to Buddhist-inspired recovery approaches.', answer: 'Meditation', value: 200 },
        { question: 'Buddhist-inspired recovery approaches draw on the teachings of this historical spiritual teacher.', answer: 'The Buddha', value: 400 },
        { question: 'The ‘Four Noble...’ are a foundational Buddhist teaching used in many mindfulness-based recovery approaches.', answer: 'Truths', value: 600 },
        { question: 'Rather than a single Higher Power, some approaches emphasize the strength found in this kind of supportive community.', answer: 'Community / fellowship', value: 800 },
        { question: 'The Sanskrit/Pali word for a community of spiritual friends or practitioners.', answer: 'Sangha', value: 1000 },
      ],
    },
    {
      name: 'Evidence-Based Recovery Tools',
      questions: [
        { question: 'Evidence-based recovery approaches often draw on principles from this type of therapy.', answer: 'Cognitive Behavioral Therapy (CBT)', value: 200 },
        { question: 'A structured recovery approach built on self-management and training toward this outcome.', answer: 'Recovery', value: 400 },
        { question: 'A core skill in evidence-based recovery tools is learning to cope with these intense impulses.', answer: 'Urges / cravings', value: 600 },
        { question: 'Some evidence-based approaches deliberately avoid labeling people with this kind of identity-based term.', answer: 'Addict / alcoholic', value: 800 },
        { question: 'This tool helps weigh the pros and cons of continuing vs. stopping a behavior.', answer: 'Cost-Benefit Analysis (CBA)', value: 1000 },
      ],
    },
    {
      name: 'Self-Care',
      questions: [
        { question: 'Getting 7-9 hours of this is crucial for recovery.', answer: 'Sleep', value: 200 },
        { question: 'This activity, even just walking, can boost mood and reduce cravings.', answer: 'Exercise', value: 400 },
        { question: 'Eating balanced meals and staying hydrated falls under this category of self-care.', answer: 'Physical self-care / nutrition', value: 600 },
        { question: 'Setting these is a key form of emotional self-care.', answer: 'Boundaries', value: 800 },
        { question: 'Journaling, meditation, and therapy are forms of this type of self-care.', answer: 'Emotional / mental', value: 1000 },
      ],
    },
    {
      name: 'Group Principles',
      questions: [
        { question: 'A core group principle: putting the wellbeing of the whole group ahead of individual interests.', answer: 'Common welfare / unity', value: 200 },
        { question: 'Many recovery groups have only one requirement for joining: this.', answer: 'A desire to stop using / get better', value: 400 },
        { question: 'Most recovery groups agree on having a single shared purpose: this.', answer: 'Helping others recover / carrying the message', value: 600 },
        { question: 'Many recovery groups aim to fund themselves without relying on this.', answer: 'Outside contributions / donations', value: 800 },
        { question: 'This principle, protecting members’ privacy, is considered foundational to trust in recovery spaces.', answer: 'Anonymity', value: 1000 },
      ],
    },
    {
      name: 'Recovery Movement History',
      questions: [
        { question: 'Many modern peer-support recovery movements trace their origins to this decade.', answer: 'The 1930s', value: 200 },
        { question: 'Early peer-support recovery movements often began with just this many people talking to each other.', answer: 'Two', value: 400 },
        { question: 'This influential psychiatrist’s ideas about ‘spiritual experience’ shaped early peer-recovery thinking.', answer: 'Carl Jung', value: 600 },
        { question: 'Peer-support recovery movements have expanded over the decades to address many different types of this.', answer: 'Addiction / substances', value: 800 },
        { question: 'This 19th-century movement, advocating total abstinence from alcohol, predates modern peer-support recovery movements.', answer: 'The Temperance Movement', value: 1000 },
      ],
    },
    {
      name: 'Gratitude',
      questions: [
        { question: 'A common recovery exercise is to make a list of these.', answer: 'Gratitude list', value: 200 },
        { question: 'Gratitude is often described as the antidote to this.', answer: 'Resentment / self-pity', value: 400 },
        { question: 'This feeling is the opposite of gratitude.', answer: 'Entitlement', value: 600 },
        { question: 'Practicing gratitude can help shift your focus from what’s wrong to what’s...', answer: 'Right', value: 800 },
        { question: 'This phrase, pairing a mindset with a feeling, is a key principle in many recovery programs.', answer: 'Attitude of Gratitude', value: 1000 },
      ],
    },
    {
      name: 'Neurobiology',
      questions: [
        { question: 'This neurotransmitter is most associated with the brain’s reward system.', answer: 'Dopamine', value: 200 },
        { question: 'Addiction ‘hijacks’ this system in the brain.', answer: 'Reward system / pathway', value: 400 },
        { question: 'This part of the brain, responsible for judgment, is often impaired by addiction.', answer: 'Prefrontal cortex', value: 600 },
        { question: 'The brain’s ability to change and form new pathways in recovery.', answer: 'Neuroplasticity', value: 800 },
        { question: 'This almond-shaped part of the brain is associated with emotion and fear, and is hyperactive in early recovery.', answer: 'Amygdala', value: 1000 },
      ],
    },
    {
      name: 'Service Work',
      questions: [
        { question: 'A common service position is making this at a meeting.', answer: 'Coffee', value: 200 },
        { question: 'This service position involves greeting people at the door.', answer: 'Greeter', value: 400 },
        { question: 'Service is a key part of the final step in many programs, which involves ‘carrying the message.’', answer: 'The last step', value: 600 },
        { question: 'This type of service involves sharing one’s story at a meeting.', answer: 'Speaking', value: 800 },
        { question: 'The principle behind service: ‘You can’t... what you don’t have.’', answer: 'Keep', value: 1000 },
      ],
    },
    {
      name: 'Therapy & Treatment',
      questions: [
        { question: 'CBT stands for Cognitive... Therapy.', answer: 'Behavioral', value: 200 },
        { question: 'This type of treatment involves living at a facility.', answer: 'Inpatient / residential', value: 400 },
        { question: 'DBT, or Dialectical Behavior Therapy, heavily emphasizes this skill.', answer: 'Mindfulness', value: 600 },
        { question: 'This acronym stands for a common intensive program that doesn’t require living onsite.', answer: 'IOP (Intensive Outpatient Program)', value: 800 },
        { question: 'This type of therapy, often using buzzers or eye movements, helps process trauma.', answer: 'EMDR', value: 1000 },
      ],
    },
  ],
  finalJeopardy: {
    category: 'Recovery Movement History',
    question: 'Many peer-support recovery movements grew to support not just the person in recovery, but this group too.',
    answer: 'Family members / loved ones',
  },
};
