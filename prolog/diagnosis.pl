% =====================================================================
%  AmmaCare - symptom suggestion knowledge base
%  Runs on Tau-Prolog (Node.js) and is also valid SWI-Prolog.
%
%  This gives SUGGESTIONS only, never a diagnosis.
%
%  symptom(Id, Label, Group).         Group: pregnancy | child | both
%  condition(Id, Name, Group, Doctor, Advice, Symptoms).
%  red_flag(SymptomId, Reason).       Symptoms that need urgent care
% =====================================================================

% ---------- Symptoms ----------
% Shared
symptom(fever, 'Fever', both).
symptom(high_fever, 'High fever (39 C or above)', both).
symptom(fatigue, 'Tiredness / weakness', both).
symptom(rash, 'Skin rash', both).
symptom(bleeding_gums, 'Bleeding gums or nose', both).
symptom(body_aches, 'Body or joint aches', both).
symptom(constipation, 'Constipation', both).
symptom(sleep_problems, 'Trouble sleeping', both).
symptom(pale_skin, 'Pale skin, lips or nails', both).

% Pregnancy
symptom(nausea, 'Nausea', pregnancy).
symptom(vomiting, 'Vomiting', pregnancy).
symptom(unable_to_keep_fluids, 'Cannot keep fluids down', pregnancy).
symptom(weight_loss, 'Losing weight', pregnancy).
symptom(dizziness, 'Dizziness or fainting', pregnancy).
symptom(shortness_of_breath, 'Short of breath', pregnancy).
symptom(fast_heartbeat, 'Fast or pounding heartbeat', pregnancy).
symptom(excessive_thirst, 'Very thirsty all the time', pregnancy).
symptom(frequent_urination, 'Passing urine very often', pregnancy).
symptom(blurred_vision, 'Blurred vision or seeing spots', pregnancy).
symptom(severe_headache, 'Severe headache', pregnancy).
symptom(swelling_face_hands, 'Sudden swelling of face or hands', pregnancy).
symptom(upper_abdominal_pain, 'Pain under the ribs (upper tummy)', pregnancy).
symptom(burning_urination, 'Burning when passing urine', pregnancy).
symptom(lower_abdominal_pain, 'Lower tummy pain', pregnancy).
symptom(pain_behind_eyes, 'Pain behind the eyes', pregnancy).
symptom(vaginal_bleeding, 'Vaginal bleeding or spotting', pregnancy).
symptom(abdominal_cramps, 'Period-like cramps', pregnancy).
symptom(lower_back_pain, 'Lower back pain', pregnancy).
symptom(pelvic_pressure, 'Pressure in the pelvis', pregnancy).
symptom(regular_contractions, 'Regular tightenings / contractions', pregnancy).
symptom(fluid_leakage, 'Leaking fluid from the vagina', pregnancy).
symptom(reduced_fetal_movement, 'Baby moving less than usual', pregnancy).
symptom(heartburn, 'Heartburn / acid in the throat', pregnancy).
symptom(bloating, 'Bloating or gas', pregnancy).
symptom(itchy_palms_soles, 'Itchy palms and soles (worse at night)', pregnancy).
symptom(dark_urine, 'Dark urine', pregnancy).
symptom(persistent_sadness, 'Feeling sad or low most days', pregnancy).
symptom(anxiety, 'Constant worry or panic', pregnancy).
symptom(loss_of_interest, 'No interest in things you used to enjoy', pregnancy).
symptom(leg_cramps, 'Leg cramps', pregnancy).

% Child (toddlers and young children)
symptom(runny_nose, 'Runny or blocked nose', child).
symptom(cough, 'Cough', child).
symptom(sneezing, 'Sneezing', child).
symptom(sore_throat, 'Sore throat', child).
symptom(diarrhoea, 'Diarrhoea (loose, watery stools)', child).
symptom(child_vomiting, 'Vomiting', child).
symptom(poor_feeding, 'Not feeding or eating well', child).
symptom(fewer_wet_nappies, 'Fewer wet nappies / little urine', child).
symptom(lethargy, 'Unusually drowsy or hard to wake', child).
symptom(mouth_sores, 'Sores or blisters in the mouth', child).
symptom(ear_pain, 'Ear pain or pulling at the ear', child).
symptom(irritability, 'Very cranky or crying a lot', child).
symptom(wheezing, 'Wheezing (whistling breath)', child).
symptom(fast_breathing, 'Fast breathing', child).
symptom(difficulty_breathing, 'Struggling to breathe', child).
symptom(itchy_blisters, 'Itchy spots that turn into blisters', child).
symptom(dry_itchy_skin, 'Dry, itchy skin', child).
symptom(red_patches, 'Red, rough skin patches', child).
symptom(itchy_bottom, 'Itchy bottom (especially at night)', child).
symptom(tummy_ache, 'Tummy ache', child).
symptom(poor_appetite, 'Poor appetite', child).
symptom(drooling, 'Drooling a lot', child).
symptom(swollen_gums, 'Swollen, sore gums', child).
symptom(convulsions, 'Fits / convulsions', child).

% ---------- Conditions: pregnancy ----------
condition(hyperemesis, 'Severe morning sickness (hyperemesis gravidarum)', pregnancy,
    'Consultant Obstetrician and Gynaecologist (VOG)',
    'Sip fluids often and eat small dry meals. If you cannot keep fluids down for a day, go to hospital as you may need a drip.',
    [nausea, vomiting, unable_to_keep_fluids, weight_loss, dizziness]).

condition(morning_sickness, 'Normal morning sickness', pregnancy,
    'Your PHM midwife or MOH antenatal clinic',
    'Very common in the first trimester. Try small frequent meals, ginger (inguru) tea and avoid oily food. Mention it at your next clinic visit.',
    [nausea, vomiting, fatigue]).

condition(anaemia, 'Iron-deficiency anaemia', pregnancy,
    'MOH antenatal clinic or your VOG (ask for a haemoglobin test)',
    'Take the iron and folic acid tablets from your clinic, eat green leaves, dhal, fish and sprats, and avoid tea with meals.',
    [fatigue, pale_skin, dizziness, shortness_of_breath, fast_heartbeat]).

condition(gestational_diabetes, 'Possible gestational diabetes', pregnancy,
    'VOG and a Consultant Physician or Endocrinologist',
    'Ask for a blood sugar test (OGTT). Until then cut down sweets, sugary tea and large white rice portions.',
    [excessive_thirst, frequent_urination, fatigue, blurred_vision]).

condition(pre_eclampsia, 'Possible pre-eclampsia (high blood pressure in pregnancy)', pregnancy,
    'Urgent: VOG at your nearest hospital',
    'This can become serious quickly. Get your blood pressure and urine checked today.',
    [severe_headache, blurred_vision, swelling_face_hands, upper_abdominal_pain]).

condition(uti, 'Urinary tract infection', pregnancy,
    'General Practitioner or your VOG',
    'You will need a urine test and pregnancy-safe antibiotics. Drink plenty of water meanwhile.',
    [burning_urination, frequent_urination, lower_abdominal_pain, fever]).

condition(dengue, 'Possible dengue fever', pregnancy,
    'Hospital: ask for a full blood count (FBC) today',
    'Dengue needs close monitoring in pregnancy. Rest, drink plenty of fluids and use only paracetamol. Do not take other painkillers unless your doctor prescribed them.',
    [high_fever, body_aches, pain_behind_eyes, rash, bleeding_gums, severe_headache]).

condition(pregnancy_bleeding, 'Bleeding in pregnancy (needs checking)', pregnancy,
    'Emergency: maternity unit of your nearest hospital',
    'Bleeding has many causes and some are serious. Go to hospital now and bring your pregnancy record.',
    [vaginal_bleeding, abdominal_cramps, lower_back_pain]).

condition(preterm_labour, 'Possible early (preterm) labour', pregnancy,
    'Emergency: hospital labour room',
    'If you are less than 37 weeks and have these signs, go to hospital now.',
    [regular_contractions, lower_back_pain, pelvic_pressure, fluid_leakage]).

condition(reduced_movements, 'Reduced baby movements', pregnancy,
    'Emergency: hospital maternity unit today (for a CTG check)',
    'Do not wait until the next day. Lie on your left side and go to hospital if movements are still less than usual.',
    [reduced_fetal_movement]).

condition(heartburn_reflux, 'Heartburn / acid reflux', pregnancy,
    'PHM or MOH clinic (VOG if severe)',
    'Eat smaller meals, stay upright for two hours after eating and limit spicy, oily food.',
    [heartburn, bloating, nausea]).

condition(pregnancy_constipation, 'Pregnancy constipation', pregnancy,
    'PHM or MOH clinic',
    'Add fibre (red rice, kola kenda, fruit, vegetables), drink more water and take gentle walks.',
    [constipation, bloating, lower_abdominal_pain]).

condition(cholestasis, 'Possible obstetric cholestasis (liver condition)', pregnancy,
    'VOG: ask for liver function and bile acid tests',
    'Itching of the palms and soles without a rash needs a blood test. Tell your doctor soon.',
    [itchy_palms_soles, sleep_problems, dark_urine]).

condition(antenatal_depression, 'Antenatal depression or anxiety', pregnancy,
    'Your VOG or MOH clinic, and a Consultant Psychiatrist if needed. National Mental Health Helpline: 1926',
    'You are not alone and this is treatable. Talk to someone you trust and tell your midwife how you feel.',
    [persistent_sadness, anxiety, sleep_problems, loss_of_interest, fatigue]).

condition(leg_cramps_preg, 'Pregnancy leg cramps', pregnancy,
    'PHM or MOH clinic',
    'Stretch your calves before bed, drink water and eat calcium-rich food such as sprats and milk.',
    [leg_cramps, sleep_problems]).

% ---------- Conditions: child ----------
condition(common_cold, 'Common cold', child,
    'Family doctor / General Practitioner',
    'Keep your child drinking fluids, clear the nose with saline drops and let them rest. See a doctor if fever lasts over 2 days.',
    [runny_nose, cough, sneezing, fever, sore_throat]).

condition(gastroenteritis, 'Gastroenteritis (tummy infection)', child,
    'General Practitioner; Consultant Paediatrician if dehydrated',
    'Give ORS (Jeevani) in small, frequent sips and keep breastfeeding or feeding. Watch for fewer wet nappies.',
    [diarrhoea, child_vomiting, fever, poor_feeding, tummy_ache]).

condition(dehydration, 'Dehydration', child,
    'Emergency: nearest hospital or Consultant Paediatrician',
    'Young children dehydrate quickly. Give ORS on the way and go to hospital now.',
    [fewer_wet_nappies, lethargy, child_vomiting, diarrhoea]).

condition(dengue_child, 'Possible dengue fever', child,
    'Hospital: ask for a full blood count (FBC) today',
    'Give only paracetamol for fever and plenty of fluids. Watch closely for vomiting, drowsiness and bleeding.',
    [high_fever, rash, child_vomiting, lethargy, bleeding_gums, body_aches]).

condition(hfmd, 'Hand, foot and mouth disease', child,
    'Consultant Paediatrician or GP',
    'Offer cool, soft foods and fluids. Keep your child home until the blisters dry.',
    [fever, mouth_sores, rash, poor_feeding]).

condition(ear_infection, 'Ear infection (otitis media)', child,
    'Consultant Paediatrician or ENT Surgeon',
    'Paracetamol can help the pain. See a doctor if it lasts more than a day or there is discharge from the ear.',
    [ear_pain, fever, irritability, sleep_problems]).

condition(wheezing_illness, 'Bronchiolitis or wheezing illness', child,
    'Consultant Paediatrician',
    'Go urgently if breathing looks hard, the ribs pull in, or the lips look blue.',
    [cough, wheezing, fast_breathing, runny_nose]).

condition(chest_infection, 'Possible chest infection (pneumonia)', child,
    'Urgent: Consultant Paediatrician or hospital',
    'Fast or difficult breathing with fever needs to be checked today.',
    [cough, high_fever, fast_breathing, difficulty_breathing, lethargy]).

condition(chickenpox, 'Chickenpox', child,
    'General Practitioner or Paediatrician',
    'Keep nails short and use calamine for itching. Keep your child away from pregnant women who have not had chickenpox.',
    [itchy_blisters, fever, fatigue, poor_appetite]).

condition(eczema, 'Eczema (atopic dermatitis)', child,
    'Consultant Paediatrician or Consultant Dermatologist',
    'Use a fragrance-free moisturiser often, lukewarm baths and soft cotton clothes.',
    [dry_itchy_skin, red_patches, sleep_problems]).

condition(threadworms, 'Worm infestation (threadworms)', child,
    'General Practitioner or Paediatrician',
    'Ask about deworming for the whole family. Wash hands before meals and keep nails short.',
    [itchy_bottom, tummy_ache, poor_appetite, sleep_problems]).

condition(teething, 'Teething', child,
    'PHM or GP (see a doctor if fever is high)',
    'A chilled teething ring can help. Teething does not cause high fever, so a high fever needs a check.',
    [drooling, swollen_gums, irritability, fever]).

condition(child_constipation, 'Constipation', child,
    'PHM or General Practitioner',
    'Offer more water, fruit (papaya, banana) and vegetables. See a doctor if there is blood or severe pain.',
    [constipation, tummy_ache, poor_appetite]).

condition(child_anaemia, 'Possible iron-deficiency anaemia', child,
    'Consultant Paediatrician (a simple blood test can check)',
    'Include iron-rich foods such as fish, egg, dhal and green leaves with vitamin C fruit.',
    [pale_skin, fatigue, poor_appetite, irritability]).

% ---------- Red flags ----------
red_flag(vaginal_bleeding, 'Vaginal bleeding in pregnancy needs checking at a hospital now.').
red_flag(fluid_leakage, 'Leaking fluid may mean your waters have broken. Go to hospital.').
red_flag(reduced_fetal_movement, 'Reduced baby movements must be checked the same day.').
red_flag(unable_to_keep_fluids, 'Not keeping fluids down can dehydrate you and your baby quickly.').
red_flag(bleeding_gums, 'Bleeding with fever can be a dengue warning sign. Do an FBC today.').
red_flag(difficulty_breathing, 'Struggling to breathe is an emergency.').
red_flag(convulsions, 'A fit or convulsion needs emergency care.').
red_flag(lethargy, 'A child who is very drowsy or hard to wake needs urgent care.').
red_flag(fewer_wet_nappies, 'Few wet nappies can mean dehydration.').

% ---------- Helper predicates ----------
in_list(X, [X|_]) :- !.
in_list(X, [_|T]) :- in_list(X, T).

len([], 0).
len([_|T], N) :- len(T, N0), N is N0 + 1.

count_matches([], _, 0).
count_matches([S|T], User, N) :-
    count_matches(T, User, N0),
    ( in_list(S, User) -> N is N0 + 1 ; N = N0 ).

% ---------- Main rules ----------
% suggest(+UserSymptoms, +Group, -Id, -Name, -Doctor, -Advice, -Matched, -Total, -Score)
suggest(User, Group, Id, Name, Doctor, Advice, Matched, Total, Score) :-
    condition(Id, Name, Group, Doctor, Advice, Symptoms),
    count_matches(Symptoms, User, Matched),
    Matched > 0,
    len(Symptoms, Total),
    Score is (Matched * 100) // Total.

% emergency(+UserSymptoms, -Reason)
emergency(User, Reason) :-
    red_flag(S, Reason),
    in_list(S, User).
emergency(User, 'Severe headache with blurred vision can be a sign of pre-eclampsia. Check your blood pressure today.') :-
    in_list(severe_headache, User),
    in_list(blurred_vision, User).
emergency(User, 'High fever with a rash should be checked by a doctor today.') :-
    in_list(high_fever, User),
    in_list(rash, User).

% ---------- How soon to be seen, and which specialist ----------
% urgency(ConditionId, Level).   Level: routine | soon | urgent
% specialty(ConditionId, Key).   Key matches data/places.json
urgency(hyperemesis, soon).
urgency(morning_sickness, routine).
urgency(anaemia, soon).
urgency(gestational_diabetes, soon).
urgency(pre_eclampsia, urgent).
urgency(uti, soon).
urgency(dengue, urgent).
urgency(pregnancy_bleeding, urgent).
urgency(preterm_labour, urgent).
urgency(reduced_movements, urgent).
urgency(heartburn_reflux, routine).
urgency(pregnancy_constipation, routine).
urgency(cholestasis, soon).
urgency(antenatal_depression, soon).
urgency(leg_cramps_preg, routine).
urgency(common_cold, routine).
urgency(gastroenteritis, soon).
urgency(dehydration, urgent).
urgency(dengue_child, urgent).
urgency(hfmd, soon).
urgency(ear_infection, soon).
urgency(wheezing_illness, soon).
urgency(chest_infection, urgent).
urgency(chickenpox, soon).
urgency(eczema, routine).
urgency(threadworms, routine).
urgency(teething, routine).
urgency(child_constipation, routine).
urgency(child_anaemia, soon).

specialty(hyperemesis, obstetrician).
specialty(morning_sickness, obstetrician).
specialty(anaemia, obstetrician).
specialty(gestational_diabetes, physician).
specialty(pre_eclampsia, obstetrician).
specialty(uti, gp).
specialty(dengue, physician).
specialty(pregnancy_bleeding, obstetrician).
specialty(preterm_labour, obstetrician).
specialty(reduced_movements, obstetrician).
specialty(heartburn_reflux, obstetrician).
specialty(pregnancy_constipation, obstetrician).
specialty(cholestasis, obstetrician).
specialty(antenatal_depression, psychiatrist).
specialty(leg_cramps_preg, obstetrician).
specialty(common_cold, gp).
specialty(gastroenteritis, paediatrician).
specialty(dehydration, paediatrician).
specialty(dengue_child, paediatrician).
specialty(hfmd, paediatrician).
specialty(ear_infection, ent).
specialty(wheezing_illness, paediatrician).
specialty(chest_infection, paediatrician).
specialty(chickenpox, paediatrician).
specialty(eczema, dermatologist).
specialty(threadworms, gp).
specialty(teething, paediatrician).
specialty(child_constipation, gp).
specialty(child_anaemia, paediatrician).

% If a red-flag symptom is present, the visit becomes urgent
final_urgency(User, _, urgent) :- emergency(User, _), !.
final_urgency(_, Id, Level) :- urgency(Id, Level), !.
final_urgency(_, _, soon).

% Every symptom that belongs to a condition (used for "Matched from")
mem(X, [X|_]).
mem(X, [_|T]) :- mem(X, T).
cond_symptom(Id, S) :- condition(Id, _, _, _, _, Ss), mem(S, Ss).
