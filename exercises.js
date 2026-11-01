/* Exercise library.
 * equip: 'bw' | 'db' | 'kb'
 * groups: target areas, primary first ('lower' | 'upper' | 'obliques' | 'full')
 * glutes: true if it also trains the glutes
 * c: movement complexity 1-3, i: base intensity 1-3, uni: done per side
 */
(function (global) {
  'use strict';

  // ---- reusable poses ----------------------------------------------------
  const ARMS_FLOOR = { a: [5, 0], b: [5, 0] };              // lying, arms beside body
  const ARMS_UP = { a: [-90, -90], b: [-88, -88] };         // lying, arms to ceiling
  const ARMS_OVER = { a: [185, 185], b: [183, 183] };       // lying, arms overhead
  const ARMS_HEAD = { a: [250, 120], b: [248, 118] };       // hands behind head
  const KNEES = { l: [-50, 50], m: [-50, 50] };             // knees bent, feet down
  const TABLE = { l: [-90, 0], m: [-90, 0] };               // tabletop legs
  const LEGS_UP = { l: [-90, -90], m: [-90, -90] };
  const LIE = Object.assign({ t: 180 }, ARMS_FLOOR, { l: [0, 0], m: [0, 0] });
  const HIGH_PLANK = { t: -24, a: [90, 90], b: [92, 92], l: [156, 156], m: [156, 156] };
  const FORE_PLANK = { t: -12, a: [90, 0], b: [90, 0], l: [168, 168], m: [168, 168] };
  const ALL_FOURS = { t: -15, a: [90, 90], b: [90, 90], l: [90, 180], m: [90, 180] };
  const STAND = { t: -90, a: [95, 90], b: [85, 90], l: [92, 90], m: [88, 90] };
  const STAND_FRONT = { t: -90, a: [100, 95], b: [80, 85], l: [98, 95], m: [82, 85] };
  const SEATED = { t: 240, a: [35, -15], b: [35, -15], l: [-40, 35], m: [-40, 35] };
  const BRIDGE_DOWN = Object.assign({ t: 180 }, ARMS_FLOOR, { l: [-55, 65], m: [-55, 65] });
  const BRIDGE_UP = Object.assign({ t: 160 }, { a: [12, 2], b: [12, 2] }, { l: [-15, 75], m: [-15, 75] });

  const P = (...parts) => Object.assign({}, ...parts);

  const EXERCISES = [
    // ---------------- Bodyweight ----------------
    { id: 'crunch', name: 'Crunch', equip: 'bw', groups: ['upper'], c: 1, i: 1,
      desc: 'Lie on your back, knees bent. Curl your shoulders off the floor, reaching your hands towards your knees.',
      cues: ['Exhale as you curl up', 'Keep your lower back on the floor', 'Chin off your chest'],
      A: P(LIE, KNEES), B: P(LIE, KNEES, { t: 212, a: [-12, -12], b: [-12, -12] }) },

    { id: 'situp', name: 'Sit-Up', equip: 'bw', groups: ['upper', 'full'], c: 1, i: 2,
      desc: 'From lying with knees bent and arms crossed on your chest, roll all the way up to sitting, then lower with control.',
      cues: ['Roll up one vertebra at a time', 'Lower slowly, no flopping back', 'Keep your feet planted'],
      A: P(LIE, KNEES, { a: [-60, 150], b: [-58, 148] }), B: P(KNEES, { t: 280, a: [40, 250], b: [42, 252] }), tempo: 3 },

    { id: 'toe-touch', name: 'Toe Touches', equip: 'bw', groups: ['upper'], c: 1, i: 2,
      desc: 'Lie on your back with legs pointing to the ceiling. Crunch up and reach your hands towards your toes.',
      cues: ['Legs stay vertical', 'Lift with your abs, not your neck', 'Pause briefly at the top'],
      A: P(LIE, LEGS_UP, { a: [-80, -80], b: [-80, -80] }), B: P(LIE, LEGS_UP, { t: 218, a: [-62, -62], b: [-62, -62] }), tempo: 2 },

    { id: 'butterfly-situp', name: 'Butterfly Sit-Up', equip: 'bw', groups: ['upper'], c: 1, i: 2,
      desc: 'Soles of your feet together, knees falling open. Reach your arms overhead, then sit up and touch your feet.',
      cues: ['Swing the arms to help at first', 'Lower with control', 'Keep the feet together'],
      A: P(LIE, ARMS_OVER, { l: [-30, 40], m: [-30, 40] }), B: { t: 285, a: [40, 60], b: [42, 62], l: [-30, 40], m: [-30, 40] }, tempo: 2.8 },

    { id: 'crunch-hold', name: 'Crunch Pulse', equip: 'bw', groups: ['upper'], c: 1, i: 2,
      desc: 'Crunch up and stay there, then pulse a few centimetres up and down without lowering your shoulders.',
      cues: ['Shoulders never touch down', 'Short, quick pulses', 'Keep breathing'],
      A: P(LIE, KNEES, { t: 204, a: [-8, -8], b: [-8, -8] }), B: P(LIE, KNEES, { t: 214, a: [-14, -14], b: [-14, -14] }), tempo: 0.9 },

    { id: 'long-arm-crunch', name: 'Long-Arm Crunch', equip: 'bw', groups: ['upper'], c: 1, i: 2,
      desc: 'Lie with knees bent and arms extended overhead by your ears. Crunch up keeping your arms in line with your head.',
      cues: ['Arms stay by your ears', 'Lift from the abs, not the arms', 'Slow on the way down'],
      A: P(LIE, KNEES, ARMS_OVER), B: P(LIE, KNEES, { t: 210, a: [215, 215], b: [213, 213] }), tempo: 2.4 },

    { id: 'tabletop-crunch', name: 'Tabletop Crunch', equip: 'bw', groups: ['upper', 'lower'], c: 1, i: 2,
      desc: 'Hold your legs in tabletop, knees over hips. Crunch your shoulders up, reaching your hands past your thighs.',
      cues: ['Legs stay still at 90°', 'Exhale on the crunch', 'Lower back flat'],
      A: P(LIE, TABLE, { a: [-30, -30], b: [-30, -30] }), B: P(LIE, TABLE, { t: 214, a: [-10, -10], b: [-10, -10] }), tempo: 2.2 },

    { id: 'cross-crunch', name: 'Cross-Body Crunch', equip: 'bw', groups: ['obliques', 'upper'], c: 1, i: 1,
      desc: 'Hands behind your head, knees bent. Crunch up and rotate one elbow towards the opposite knee. Alternate sides.',
      cues: ['Lead with the shoulder, not the elbow', 'Lower all the way', 'Exhale as you rotate'],
      A: P(LIE, KNEES, ARMS_HEAD, { t: 182 }), B: P(LIE, KNEES, ARMS_HEAD, { t: 212 }), tempo: 2.2 },

    { id: 'heel-tap', name: 'Alternating Heel Taps', equip: 'bw', groups: ['obliques', 'upper'], c: 1, i: 1,
      desc: 'Shoulders lifted, knees bent. Crunch sideways and tap one heel, then the other, without lowering your shoulders.',
      cues: ['Shoulder blades stay off the floor', 'Side-bend from your waist', 'Small, controlled taps'],
      A: P(LIE, KNEES, { t: 200, a: [8, 12], b: [8, 12] }), B: P(LIE, KNEES, { t: 206, a: [18, 28], b: [2, 4] }), tempo: 1.6 },

    { id: 'bicycle', name: 'Bicycle Crunch', equip: 'bw', groups: ['obliques', 'upper'], c: 2, i: 2,
      desc: 'Hands behind your head. Bring one knee in while rotating the opposite elbow towards it, extending the other leg. Alternate.',
      cues: ['Rotate through your ribs, not your neck', 'Fully extend the straight leg', 'Slow beats fast'],
      A: P(LIE, ARMS_HEAD, { t: 205, l: [-70, 0], m: [-15, -15] }), B: P(LIE, ARMS_HEAD, { t: 210, l: [-15, -15], m: [-70, 0] }), tempo: 2.2 },

    { id: 'dead-bug', name: 'Dead Bug', equip: 'bw', groups: ['lower', 'full'], c: 2, i: 1,
      desc: 'Lie on your back, arms up, knees over hips. Lower opposite arm and leg towards the floor, return and switch sides.',
      cues: ['Press your lower back into the floor', 'Move slowly', 'Exhale as you extend'],
      A: P(LIE, ARMS_UP, TABLE), B: P(LIE, { a: [192, 192], b: [-88, -88], l: [-90, 0], m: [-8, -8] }), tempo: 3 },

    { id: 'reverse-crunch', name: 'Reverse Crunch', equip: 'bw', groups: ['lower'], c: 1, i: 2,
      desc: 'Lie on your back, knees bent at 90°. Curl your hips off the floor, bringing your knees towards your chest.',
      cues: ['Lift your hips, don\'t just swing your legs', 'Lower slowly', 'Arms flat on the floor'],
      A: P(LIE, TABLE), B: P(LIE, { t: 170, l: [-125, -40], m: [-125, -40] }), tempo: 2.4 },

    { id: 'leg-raise', name: 'Lying Leg Raise', equip: 'bw', groups: ['lower'], c: 1, i: 2,
      desc: 'Lie flat with straight legs. Raise them to vertical, then lower until they hover just above the floor.',
      cues: ['Lower back stays glued to the floor', 'Legs straight and together', 'Control the way down'],
      A: P(LIE, { l: [-6, -6], m: [-6, -6] }), B: P(LIE, LEGS_UP), tempo: 3 },

    { id: 'flutter', name: 'Flutter Kicks', equip: 'bw', groups: ['lower'], c: 1, i: 2,
      desc: 'Lie on your back, legs straight and slightly raised. Kick them up and down in small, quick alternating movements.',
      cues: ['Lower back pressed down', 'Small range, steady rhythm', 'Breathe continuously'],
      A: P(LIE, { t: 186, l: [-28, -28], m: [-10, -10] }), B: P(LIE, { t: 186, l: [-10, -10], m: [-28, -28] }), tempo: 0.9 },

    { id: 'scissor', name: 'Scissor Kicks', equip: 'bw', groups: ['lower'], c: 1, i: 2,
      desc: 'Legs straight and hovering. Cross them over each other, alternating which leg is on top, like scissors.',
      cues: ['Keep the legs low but off the floor', 'Point your toes', 'Back flat'],
      A: P(LIE, { t: 186, l: [-20, -20], m: [-12, -12] }), B: P(LIE, { t: 186, l: [-12, -12], m: [-20, -20] }), tempo: 1.1 },

    { id: 'leg-lower', name: 'Bent-Knee Leg Lowers', equip: 'bw', groups: ['lower'], c: 1, i: 1,
      desc: 'Lie on your back with knees bent at 90° above your hips. Slowly lower one heel to tap the floor, return, switch.',
      cues: ['Back stays flat', 'Move only from the hip', 'Exhale as you lower'],
      A: P(LIE, TABLE), B: P(LIE, { l: [-28, 55], m: [-90, 0] }), tempo: 2.6 },

    { id: 'seated-tuck', name: 'Seated Knee Tucks', equip: 'bw', groups: ['lower', 'full'], c: 1, i: 2,
      desc: 'Sit leaning back on your hands. Extend your legs out low, then pull your knees into your chest.',
      cues: ['Lean back with a long spine', 'Legs hover, feet never touch', 'Squeeze at the tuck'],
      A: { t: 235, a: [130, 95], b: [130, 95], l: [-8, -8], m: [-8, -8] }, B: { t: 250, a: [140, 95], b: [140, 95], l: [-55, 30], m: [-55, 30] }, tempo: 2.2 },

    { id: 'plank-tuck', name: 'Plank Knee Tucks', equip: 'bw', groups: ['lower', 'full'], c: 1, i: 2,
      desc: 'In a high plank, slowly draw one knee towards your chest, round your back slightly, return and switch.',
      cues: ['Shoulders over wrists', 'Round your back at the tuck', 'Slow and controlled'],
      A: HIGH_PLANK, B: P(HIGH_PLANK, { t: -28, l: [60, 150] }), tempo: 2.4 },

    { id: 'hollow-hold', name: 'Hollow Body Hold', equip: 'bw', groups: ['full', 'lower'], c: 2, i: 3,
      desc: 'Lift shoulders and legs off the floor, arms extended overhead. Hold a shallow banana shape.',
      cues: ['Lower back pressed into the floor', 'Bend the knees to make it easier', 'Breathe, don\'t hold your breath'],
      A: P({ t: 200, l: [-14, -14], m: [-14, -14] }, ARMS_OVER), B: P({ t: 202, l: [-17, -17], m: [-17, -17] }, { a: [190, 190], b: [188, 188] }), tempo: 4 },

    { id: 'hollow-rock', name: 'Hollow Rocks', equip: 'bw', groups: ['full', 'lower'], c: 3, i: 3,
      desc: 'Hold the hollow position and rock back and forth like a rocking chair, keeping the shape rigid.',
      cues: ['The shape never changes', 'Momentum comes from your abs', 'Arms stay by your ears'],
      A: P({ t: 202, l: [-12, -12], m: [-12, -12] }, ARMS_OVER), B: P({ t: 186, l: [-32, -32], m: [-32, -32] }, { a: [172, 172], b: [170, 170] }), tempo: 1.4 },

    { id: 'v-up', name: 'V-Up', equip: 'bw', groups: ['full', 'upper', 'lower'], c: 3, i: 3,
      desc: 'From lying fully extended, lift arms and legs at the same time and touch your toes at the top, forming a V.',
      cues: ['Legs straight', 'Balance on your glutes at the top', 'Lower with control'],
      A: P(LIE, ARMS_OVER, { l: [-4, -4], m: [-4, -4] }), B: { t: 235, a: [-48, -48], b: [-46, -46], l: [-58, -58], m: [-58, -58] }, tempo: 2.4 },

    { id: 'tuck-up', name: 'Tuck-Up', equip: 'bw', groups: ['full', 'lower'], c: 2, i: 2,
      desc: 'Lie extended, then sit up while pulling your knees into your chest and hugging them. Extend back out.',
      cues: ['Hover legs on the way out', 'Exhale on the tuck', 'Stay controlled'],
      A: P(LIE, ARMS_OVER, { l: [-6, -6], m: [-6, -6] }), B: { t: 240, a: [-20, 30], b: [-18, 32], l: [-65, 25], m: [-65, 25] }, tempo: 2.4 },

    { id: 'windshield', name: 'Windshield Wipers', equip: 'bw', groups: ['obliques', 'lower'], c: 3, i: 3,
      desc: 'Lie with arms out wide, legs pointing up. Lower both legs to one side, back up through the middle, then to the other side.',
      cues: ['Shoulders stay on the floor', 'Go only as low as you can control', 'Bend knees to scale'],
      A: P(LIE, LEGS_UP, { a: [-140, 200], b: [-40, 20] }), B: P(LIE, { l: [-35, -35], m: [-35, -35], a: [-140, 200], b: [-40, 20] }), tempo: 3 },

    { id: 'plank', name: 'Forearm Plank', equip: 'bw', groups: ['full'], c: 1, i: 2,
      desc: 'Forearms under shoulders, body in a straight line from head to heels. Hold.',
      cues: ['Squeeze glutes and abs', 'Don\'t let your hips sag', 'Push the floor away'],
      A: FORE_PLANK, B: P(FORE_PLANK, { t: -13, l: [167, 167], m: [167, 167] }), tempo: 4 },

    { id: 'shoulder-tap', name: 'Plank Shoulder Taps', equip: 'bw', groups: ['full', 'obliques'], c: 2, i: 2,
      desc: 'In a high plank, lift one hand and tap the opposite shoulder. Alternate without rocking your hips.',
      cues: ['Feet wider for stability', 'Hips stay square', 'Slow and controlled'],
      A: P(HIGH_PLANK, { a: [128, 205] }), B: P(HIGH_PLANK, { b: [126, 205] }), tempo: 1.8 },

    { id: 'up-down', name: 'Up-Down Plank', equip: 'bw', groups: ['full'], c: 2, i: 3,
      desc: 'Move from forearm plank to high plank one arm at a time, then back down. Alternate the leading arm.',
      cues: ['Minimise hip sway', 'Hands under shoulders', 'Keep the core braced'],
      A: FORE_PLANK, B: HIGH_PLANK, tempo: 2.2 },

    { id: 'mountain', name: 'Mountain Climbers', equip: 'bw', groups: ['full', 'lower'], c: 2, i: 3,
      desc: 'In a high plank, drive your knees towards your chest one after the other at a steady, fast pace.',
      cues: ['Shoulders over wrists', 'Hips low', 'Drive the knees, land softly'],
      A: P(HIGH_PLANK, { l: [70, 160] }), B: P(HIGH_PLANK, { m: [70, 160] }), tempo: 0.8 },

    { id: 'cross-mountain', name: 'Cross-Body Mountain Climbers', equip: 'bw', groups: ['obliques', 'full'], c: 2, i: 3,
      desc: 'Like mountain climbers, but drive each knee towards the opposite elbow.',
      cues: ['Rotate the hip, not the shoulders', 'Stay in a strong plank', 'Steady rhythm'],
      A: P(HIGH_PLANK, { l: [55, 175] }), B: P(HIGH_PLANK, { m: [55, 175] }), tempo: 1.1 },

    { id: 'plank-jack', name: 'Plank Jacks', equip: 'bw', groups: ['full'], c: 2, i: 3,
      desc: 'In a high plank, jump your feet wide and back together like a jumping jack.',
      cues: ['Hips stay level', 'Land on the balls of your feet', 'Brace through each jump'],
      A: HIGH_PLANK, B: P(HIGH_PLANK, { t: -26, l: [150, 150], m: [162, 162] }), tempo: 0.9 },

    { id: 'bear', name: 'Bear Plank Hold', equip: 'bw', groups: ['full'], c: 2, i: 2,
      desc: 'From all fours, lift your knees an inch off the floor and hold with a flat back.',
      cues: ['Knees hover, back flat', 'Push the floor away', 'Breathe slowly'],
      A: { t: -16, a: [90, 90], b: [90, 90], l: [70, 175], m: [70, 175] }, B: { t: -17, a: [90, 90], b: [90, 90], l: [72, 176], m: [72, 176] }, tempo: 4 },

    { id: 'bird-dog', name: 'Bird Dog', equip: 'bw', groups: ['full'], glutes: true, c: 2, i: 1,
      desc: 'On all fours, extend one arm forward and the opposite leg back until both are parallel to the floor. Alternate.',
      cues: ['Keep your hips square', 'Reach long, don\'t arch', 'Pause at full extension'],
      A: ALL_FOURS, B: P(ALL_FOURS, { a: [-8, -8], m: [182, 182] }), tempo: 3 },

    { id: 'superman', name: 'Superman Hold', equip: 'bw', groups: ['full'], glutes: true, c: 1, i: 1,
      desc: 'Lie face down, arms extended forward. Lift chest, arms and legs off the floor and hold briefly, then lower.',
      cues: ['Squeeze your glutes', 'Look at the floor', 'Lift, pause, lower'],
      A: { t: 0, a: [-2, -2], b: [-2, -2], l: [180, 180], m: [180, 180] }, B: { t: -14, a: [-18, -18], b: [-18, -18], l: [194, 194], m: [194, 194] }, tempo: 3 },

    { id: 'russian-twist', name: 'Russian Twist', equip: 'bw', groups: ['obliques'], c: 2, i: 2,
      desc: 'Sit leaning back with knees bent and feet light or lifted. Rotate your torso to tap the floor on each side.',
      cues: ['Rotate from your ribs', 'Chest up, long spine', 'Lift the feet to progress'],
      A: P(SEATED, { a: [55, 75], b: [55, 75] }), B: P(SEATED, { t: 236, a: [15, -30], b: [15, -30] }), tempo: 1.6 },

    { id: 'glute-bridge', name: 'Glute Bridge', equip: 'bw', groups: ['full'], glutes: true, c: 1, i: 1,
      desc: 'Lie on your back, feet flat near your glutes. Drive your hips up until your body forms a straight line, then lower.',
      cues: ['Push through your heels', 'Squeeze glutes at the top', 'Don\'t over-arch your back'],
      A: BRIDGE_DOWN, B: BRIDGE_UP, tempo: 2.4 },

    { id: 'sl-bridge', name: 'Single-Leg Glute Bridge', equip: 'bw', groups: ['full'], glutes: true, c: 2, i: 2, uni: true,
      desc: 'Bridge on one leg with the other leg extended. Keep your hips level all the way up and down.',
      cues: ['Hips stay level', 'Drive through the heel', 'Pause at the top'],
      A: P(BRIDGE_DOWN, { m: [-40, -40] }), B: P(BRIDGE_UP, { m: [-20, -20] }), tempo: 2.4 },

    { id: 'side-plank', name: 'Side Plank', equip: 'bw', groups: ['obliques'], c: 1, i: 2, uni: true,
      desc: 'Lie on your side, elbow under shoulder, and lift your hips so your body forms a straight line. Hold.',
      cues: ['Stack your feet', 'Hips high and forward', 'Top arm to the ceiling'],
      A: P(FORE_PLANK, { t: -14, a: [-90, -90], l: [166, 166], m: [166, 166] }), B: P(FORE_PLANK, { t: -15, a: [-92, -92], l: [165, 165], m: [165, 165] }), tempo: 4 },

    { id: 'side-plank-dip', name: 'Side Plank Hip Dips', equip: 'bw', groups: ['obliques'], c: 2, i: 2, uni: true,
      desc: 'From a side plank, lower your hip towards the floor and lift it back up as high as you can.',
      cues: ['Move only at the hip', 'Elbow under shoulder', 'Control the dip'],
      A: P(FORE_PLANK, { t: -14, a: [-90, -90], l: [166, 166], m: [166, 166] }), B: P(FORE_PLANK, { t: -24, a: [-90, -90], l: [176, 176], m: [176, 176] }), tempo: 2 },

    { id: 'side-plank-reach', name: 'Side Plank Reach-Through', equip: 'bw', groups: ['obliques', 'full'], c: 3, i: 3, uni: true,
      desc: 'In a side plank, reach your top arm to the ceiling, then thread it under your body while rotating. Return.',
      cues: ['Hips stay lifted', 'Follow your hand with your eyes', 'Exhale as you thread'],
      A: P(FORE_PLANK, { t: -14, a: [-90, -90], l: [166, 166], m: [166, 166] }), B: P(FORE_PLANK, { t: -18, a: [120, 170], l: [168, 168], m: [168, 168] }), tempo: 2.6 },

    // ---------------- Dumbbell ----------------
    { id: 'db-crunch', name: 'Dumbbell Crunch Reach', equip: 'db', groups: ['upper'], c: 1, i: 2,
      desc: 'Lie with knees bent, holding a dumbbell with both hands above your chest. Crunch up, pressing the weight towards the ceiling.',
      cues: ['Arms stay vertical', 'Lift the shoulders, not the chin', 'Lower slowly'],
      A: P(LIE, KNEES, ARMS_UP), B: P(LIE, KNEES, { t: 215, a: [-82, -82], b: [-82, -82] }), prop: { k: 'db', on: ['wa'] } },

    { id: 'db-situp', name: 'Overhead Dumbbell Sit-Up', equip: 'db', groups: ['upper', 'full'], c: 2, i: 3,
      desc: 'Hold a dumbbell overhead with both hands. Sit all the way up, keeping the weight above your head, then lower.',
      cues: ['Arms locked by your ears', 'Feet stay planted', 'Use a light weight'],
      A: P(LIE, KNEES, ARMS_OVER), B: P(KNEES, { t: 278, a: [-92, -92], b: [-92, -92] }), prop: { k: 'db', on: ['wa'] }, tempo: 3 },

    { id: 'db-twist', name: 'Dumbbell Russian Twist', equip: 'db', groups: ['obliques'], c: 2, i: 3,
      desc: 'Seated and leaning back, hold a dumbbell at your chest and rotate it from hip to hip.',
      cues: ['Move the weight with your torso', 'Chest tall', 'Feet up to progress'],
      A: P(SEATED, { a: [55, 75], b: [55, 75] }), B: P(SEATED, { t: 236, a: [15, -30], b: [15, -30] }), prop: { k: 'db', on: ['wa'] }, tempo: 1.8 },

    { id: 'db-deadbug', name: 'Dumbbell Dead Bug', equip: 'db', groups: ['lower', 'full'], c: 2, i: 2,
      desc: 'Hold one dumbbell above your chest with both hands. Keep it still while you lower one leg at a time.',
      cues: ['Weight stays over your chest', 'Back flat', 'Exhale on each extension'],
      A: P(LIE, ARMS_UP, TABLE), B: P(LIE, ARMS_UP, { l: [-6, -6], m: [-90, 0] }), prop: { k: 'db', on: ['wa'] }, tempo: 3 },

    { id: 'db-legraise', name: 'Dumbbell Leg Raise', equip: 'db', groups: ['lower'], c: 2, i: 3,
      desc: 'Hold a light dumbbell between your feet and do slow leg raises.',
      cues: ['Light weight, perfect form', 'Grip the bench or floor', 'Back stays flat'],
      A: P(LIE, { a: [185, 120], b: [185, 120], l: [-6, -6], m: [-6, -6] }), B: P(LIE, LEGS_UP, { a: [185, 120], b: [185, 120] }), prop: { k: 'db', on: ['fa'] }, tempo: 3.2 },

    { id: 'db-revcrunch', name: 'Weighted Reverse Crunch', equip: 'db', groups: ['lower'], c: 2, i: 3,
      desc: 'Lie on your back holding a light dumbbell between your knees. Curl your hips up and bring your knees to your chest.',
      cues: ['Squeeze the weight with your knees', 'Lift the hips, don\'t swing', 'Lower slowly'],
      A: P(LIE, TABLE), B: P(LIE, { t: 170, l: [-125, -40], m: [-125, -40] }), prop: { k: 'db', on: ['ka'] }, tempo: 2.6 },

    { id: 'db-flutter', name: 'Dumbbell Press Flutter Kicks', equip: 'db', groups: ['lower', 'full'], c: 2, i: 3,
      desc: 'Hold a dumbbell over your chest with straight arms and keep it still while you flutter-kick your legs.',
      cues: ['Weight stays over your chest', 'Back pressed down', 'Small, quick kicks'],
      A: P(LIE, ARMS_UP, { t: 186, l: [-28, -28], m: [-10, -10] }), B: P(LIE, ARMS_UP, { t: 186, l: [-10, -10], m: [-28, -28] }), prop: { k: 'db', on: ['wa'] }, tempo: 0.9 },

    { id: 'db-sidebend', name: 'Dumbbell Side Bend', equip: 'db', groups: ['obliques'], c: 1, i: 1, uni: true,
      desc: 'Stand tall with a dumbbell in one hand. Bend sideways towards the weight, then pull yourself back up with your obliques.',
      cues: ['Bend straight sideways, no leaning forward', 'Free hand behind your head', 'Slow and full range'],
      A: P(STAND_FRONT, { a: [90, 90], b: [-60, 200] }), B: P(STAND_FRONT, { t: -66, a: [90, 90], b: [-30, 230] }), prop: { k: 'db', on: ['wa'] }, tempo: 2.6 },

    { id: 'db-woodchop', name: 'Dumbbell Woodchop', equip: 'db', groups: ['obliques', 'full'], c: 3, i: 3, uni: true,
      desc: 'Hold a dumbbell with both hands above one shoulder. Chop it diagonally down across your body to the opposite knee.',
      cues: ['Pivot the back foot', 'Rotate through your torso', 'Control the way up'],
      A: P(STAND_FRONT, { t: -96, a: [-48, -48], b: [-46, -46] }), B: P(STAND_FRONT, { t: -80, a: [118, 118], b: [116, 116], l: [104, 80], m: [76, 100] }), prop: { k: 'db', on: ['wa'] }, tempo: 2 },

    { id: 'db-renegade', name: 'Renegade Row', equip: 'db', groups: ['full', 'obliques'], c: 3, i: 3,
      desc: 'In a high plank holding two dumbbells, row one weight to your hip, lower it, then row the other.',
      cues: ['Feet wide', 'Don\'t rotate your hips', 'Elbow close to your body'],
      A: P(HIGH_PLANK, { a: [200, 100] }), B: P(HIGH_PLANK, { b: [200, 100] }), prop: { k: 'db', on: ['wa', 'wb'] }, tempo: 2.2 },

    { id: 'db-bridge', name: 'Weighted Glute Bridge', equip: 'db', groups: ['full'], glutes: true, c: 1, i: 2,
      desc: 'Rest a dumbbell on your hips and perform glute bridges, squeezing hard at the top.',
      cues: ['Hold the weight steady', 'Drive through the heels', 'Pause 1 second at the top'],
      A: P(BRIDGE_DOWN, { a: [70, 10], b: [70, 10] }), B: P(BRIDGE_UP, { a: [60, 0], b: [60, 0] }), prop: { k: 'db', on: ['hip'] }, tempo: 2.4 },

    { id: 'db-suitcase', name: 'Suitcase March', equip: 'db', groups: ['obliques', 'full'], c: 2, i: 2, uni: true,
      desc: 'Hold a heavy dumbbell in one hand at your side. March in place, lifting your knees high without leaning.',
      cues: ['Stay perfectly upright', 'Knees to hip height', 'Shoulders level'],
      A: P(STAND, { a: [90, 90], l: [0, 90] }), B: P(STAND, { a: [90, 90], m: [0, 90] }), prop: { k: 'db', on: ['wa'] }, tempo: 1.6 },

    // ---------------- Kettlebell ----------------
    { id: 'kb-swing', name: 'Kettlebell Swing', equip: 'kb', groups: ['full'], glutes: true, c: 3, i: 3,
      desc: 'Hinge at the hips and hike the kettlebell back, then snap your hips forward to swing it to chest height.',
      cues: ['Power from the hips, not the arms', 'Flat back in the hinge', 'Stand tall and squeeze glutes at the top'],
      A: { t: -32, a: [112, 118], b: [110, 116], l: [78, 102], m: [78, 102] }, B: P(STAND, { a: [-2, -2], b: [0, 0] }), prop: { k: 'kb', on: ['wa'] }, tempo: 1.6 },

    { id: 'kb-twist', name: 'Kettlebell Russian Twist', equip: 'kb', groups: ['obliques'], c: 2, i: 3,
      desc: 'Seated and leaning back, hold the kettlebell by the horns and rotate it from side to side.',
      cues: ['Rotate the chest', 'Keep the bell close', 'Breathe out on each twist'],
      A: P(SEATED, { a: [55, 75], b: [55, 75] }), B: P(SEATED, { t: 236, a: [15, -30], b: [15, -30] }), prop: { k: 'kb', on: ['wa'] }, tempo: 1.8 },

    { id: 'kb-halo', name: 'Kettlebell Halo', equip: 'kb', groups: ['upper', 'obliques'], c: 2, i: 1,
      desc: 'Stand holding the kettlebell upside down by the horns. Circle it slowly around your head, then switch direction.',
      cues: ['Brace your core, ribs down', 'Keep the bell close to your head', 'Hips stay still'],
      A: P(STAND, { a: [-45, -112], b: [-43, -110] }), B: P(STAND, { a: [-135, -62], b: [-133, -60] }), prop: { k: 'kb', on: ['wa'] }, tempo: 2.6 },

    { id: 'kb-windmill', name: 'Kettlebell Windmill', equip: 'kb', groups: ['obliques'], c: 3, i: 2, uni: true,
      desc: 'Press the kettlebell overhead. Push your hips out and lower your free hand down your leg, eyes on the bell. Return.',
      cues: ['Arm stays locked overhead', 'Hinge at the hip', 'Move slowly'],
      A: P(STAND_FRONT, { a: [-90, -90], b: [92, 92], l: [70, 70], m: [110, 110] }), B: P(STAND_FRONT, { t: -150, a: [-90, -90], b: [92, 92], l: [70, 70], m: [110, 110] }), prop: { k: 'kb', on: ['wa'] }, tempo: 3.4 },

    { id: 'kb-crunch', name: 'Kettlebell Crunch Press', equip: 'kb', groups: ['upper'], c: 2, i: 2,
      desc: 'Lie with knees bent, kettlebell held over your chest. Crunch up while pressing the bell to the ceiling.',
      cues: ['Arms vertical', 'Exhale on the way up', 'Feet stay down'],
      A: P(LIE, KNEES, { a: [-60, 170], b: [-58, 168] }), B: P(LIE, KNEES, { t: 215, a: [-82, -82], b: [-82, -82] }), prop: { k: 'kb', on: ['wa'] } },

    { id: 'kb-deadbug', name: 'Kettlebell Dead Bug', equip: 'kb', groups: ['lower', 'full'], c: 2, i: 2,
      desc: 'Hold the kettlebell above your chest with both hands. Keep it still and lower one leg at a time.',
      cues: ['Bell stays over your chest', 'Back flat', 'Slow extensions'],
      A: P(LIE, ARMS_UP, TABLE), B: P(LIE, ARMS_UP, { l: [-6, -6], m: [-90, 0] }), prop: { k: 'kb', on: ['wa'] }, tempo: 3 },

    { id: 'kb-legraise', name: 'Kettlebell Anchor Leg Raise', equip: 'kb', groups: ['lower'], c: 1, i: 2,
      desc: 'Lie on your back gripping a heavy kettlebell behind your head as an anchor. Raise your straight legs to vertical and lower slowly.',
      cues: ['Hold the bell tight', 'Back stays down', 'Three seconds down'],
      A: P(LIE, { a: [190, 40], b: [190, 40], l: [-6, -6], m: [-6, -6] }), B: P(LIE, LEGS_UP, { a: [190, 40], b: [190, 40] }), prop: { k: 'kb', on: ['wa'] }, tempo: 3.2 },

    { id: 'kb-bridge', name: 'Kettlebell Glute Bridge', equip: 'kb', groups: ['full'], glutes: true, c: 1, i: 2,
      desc: 'Rest a kettlebell on your hips and bridge up, squeezing your glutes hard at the top.',
      cues: ['Hold the bell steady', 'Heels close to your glutes', 'Ribs down'],
      A: P(BRIDGE_DOWN, { a: [70, 10], b: [70, 10] }), B: P(BRIDGE_UP, { a: [60, 0], b: [60, 0] }), prop: { k: 'kb', on: ['hip'] }, tempo: 2.4 },

    { id: 'kb-around', name: 'Kettlebell Around the World', equip: 'kb', groups: ['obliques', 'full'], c: 1, i: 1,
      desc: 'Stand tall and pass the kettlebell around your waist from hand to hand. Switch direction halfway.',
      cues: ['Hips stay still', 'Tight core', 'Smooth hand-offs'],
      A: P(STAND_FRONT, { a: [120, 40], b: [60, 140] }), B: P(STAND_FRONT, { a: [100, 70], b: [80, 110] }), prop: { k: 'kb', on: ['wa'] }, tempo: 1.6 },

    { id: 'kb-getup', name: 'Kettlebell Half Get-Up', equip: 'kb', groups: ['full', 'obliques'], c: 3, i: 3, uni: true,
      desc: 'Lie holding the kettlebell straight up, same-side knee bent. Roll to your elbow, then your hand, and reverse.',
      cues: ['Eyes on the bell', 'Arm locked vertical', 'Use a light bell'],
      A: P(LIE, { a: [-90, -90], b: [5, 0], l: [-50, 50], m: [0, 0] }), B: { t: 245, a: [-90, -90], b: [145, 95], l: [-50, 50], m: [0, 0] }, prop: { k: 'kb', on: ['wa'] }, tempo: 3.4 },

    { id: 'kb-pullthrough', name: 'Plank Pull-Through', equip: 'kb', groups: ['obliques', 'full'], c: 2, i: 3,
      desc: 'In a high plank with the kettlebell beside you, reach under your body and drag it to the other side. Alternate.',
      cues: ['Hips don\'t rotate', 'Feet wide', 'Drag, don\'t lift'],
      A: HIGH_PLANK, B: P(HIGH_PLANK, { a: [110, 160] }), prop: { k: 'kb', on: ['wa'] }, tempo: 2.2 }
  ];

  const WARMUP = [
    { id: 'wu-catcow', name: 'Cat-Cow', equip: 'bw', groups: [], c: 1, i: 1,
      desc: 'On all fours, alternate between rounding your back up (cat) and letting your belly drop while you look up (cow).',
      cues: ['Move with your breath', 'Full range, no rush'],
      A: P(ALL_FOURS, { t: -10, h: -45 }), B: P(ALL_FOURS, { t: -22, h: 35 }), tempo: 3.4 },
    { id: 'wu-hips', name: 'Hip Circles', equip: 'bw', groups: [], c: 1, i: 1,
      desc: 'Stand tall, hands on your hips. Draw big slow circles with your hips, switching direction halfway.',
      cues: ['Keep your knees soft', 'Make the circles big'],
      A: P(STAND_FRONT, { t: -80, a: [130, 45], b: [50, 135] }), B: P(STAND_FRONT, { t: -100, a: [130, 45], b: [50, 135] }), tempo: 2.4 }
  ];

  const COOLDOWN = {
    id: 'cd-cobra', name: 'Cobra Stretch', equip: 'bw', groups: [], c: 1, i: 1,
    desc: 'Lie face down and press your chest up with your arms, hips staying on the floor. Breathe into your abs.',
    cues: ['Shoulders away from ears', 'Breathe deeply'],
    A: { t: -10, a: [160, 0], b: [160, 0], l: [180, 180], m: [180, 180] }, B: { t: -40, a: [140, 50], b: [140, 50], l: [180, 180], m: [180, 180] }, tempo: 4
  };

  global.EXERCISES = EXERCISES;
  global.WARMUP = WARMUP;
  global.COOLDOWN = COOLDOWN;
})(window);
