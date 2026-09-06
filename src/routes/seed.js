import express from 'express';
import WorkoutSession from '../models/WorkoutSession.js';
import Exercise from '../models/Exercise.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// POST /api/seed/demo-history
// Wipes all sessions and seeds 10 realistic sessions over 2 weeks (Push/Pull/Legs split)
router.post('/demo-history', async (req, res) => {
  try {
    // Get user's exercises — prefer active or favourited
    const exercises = await Exercise.find({
      userId: req.user._id,
      $or: [{ active: true }, { favourite: true }],
    }).limit(40);

    const pool = exercises.length >= 3
      ? exercises
      : await Exercise.find({ userId: req.user._id }).limit(40);

    if (pool.length < 3) {
      return res.status(400).json({
        error: 'Add at least 3 exercises to your library first (or mark some as favourites).',
      });
    }

    // Smart name-based picker with multiple fallback groups
    const pick = (...groups) => {
      for (const names of groups) {
        for (const name of (Array.isArray(names) ? names : [names])) {
          const found = pool.find(e => e.name.toLowerCase().includes(name.toLowerCase()));
          if (found) return found;
        }
      }
      return null;
    };

    // ── Exercises ────────────────────────────────────────────────────────────
    const bench    = pick(['Barbell Bench Press', 'Bench Press'], ['Dumbbell Bench'], ['Push-Up'])          || pool[0];
    const incline  = pick(['Incline Barbell', 'Incline Dumbbell', 'Incline Bench'], ['Cable Fly'])          || pool[Math.min(1, pool.length-1)];
    const chest3   = pick(['Chest Fly', 'Pec Deck', 'Cable Crossover'], ['Dip'])                            || bench;
    const ohp      = pick(['Barbell Overhead', 'Overhead Press', 'OHP'], ['Dumbbell Shoulder Press'])       || pool[Math.min(2, pool.length-1)];
    const laterals = pick(['Lateral Raise', 'Side Raise'])                                                  || pool[Math.min(3, pool.length-1)];
    const front    = pick(['Front Raise'])                                                                   || laterals;
    const tricep   = pick(['Tricep Pushdown', 'Skull Crusher', 'Close Grip'], ['Tricep Extension'])         || pool[Math.min(4, pool.length-1)];
    const pullup   = pick(['Pull-Up', 'Pullup', 'Chin-Up'], ['Lat Pulldown', 'Cable Pulldown'])             || pool[Math.min(5, pool.length-1)];
    const row      = pick(['Barbell Row', 'Bent Over Row'], ['Cable Row', 'Seated Row', 'Dumbbell Row'])    || pool[Math.min(6, pool.length-1)];
    const facepull = pick(['Face Pull', 'Rear Delt'], ['Cable Row'])                                        || row;
    const curl     = pick(['Barbell Curl', 'EZ-Bar Curl', 'EZ Bar Curl'], ['Dumbbell Curl', 'Bicep Curl']) || pool[Math.min(7, pool.length-1)];
    const hamcurl  = pick(['Hammer Curl'])                                                                   || curl;
    const squat    = pick(['Barbell Squat', 'Back Squat', 'High Bar'], ['Goblet Squat'], ['Leg Press'])     || pool[Math.min(8, pool.length-1)];
    const rdl      = pick(['Romanian Deadlift', 'RDL'], ['Stiff Leg', 'Straight Leg'], ['Leg Curl'])        || pool[Math.min(9, pool.length-1)];
    const legpress = pick(['Leg Press'], ['Hack Squat'])                                                     || squat;
    const lunge    = pick(['Bulgarian Split', 'Lunge', 'Split Squat'])                                      || pool[Math.min(10, pool.length-1)];
    const calf     = pick(['Calf Raise', 'Standing Calf'], ['Seated Calf'])                                 || pool[Math.min(11, pool.length-1)];
    const deadlift = pick(['Conventional Deadlift', 'Deadlift'], ['Trap Bar'])                              || rdl;

    // ── Helper builders ──────────────────────────────────────────────────────
    // unit must always be 'kg' or 'lbs' — bodyweight sets use weight:0, unit:'kg'
    function s(weight, reps) {
      return { weight, reps, unit: 'kg' };
    }
    function exEntry(ex, setsData, isBodyweight = false) {
      return {
        exerciseId:   ex._id,
        exerciseName: ex.name,
        muscleGroup:  ex.muscleGroup || '',
        unilateral:   ex.unilateral  || false,
        isBodyweight: isBodyweight || ex.equipment === 'Bodyweight',
        isTimed:      false,
        order:        0,
        sets: setsData.map((sd, i) => ({
          setNumber: i + 1,
          weight:    sd.weight,
          reps:      sd.reps,
          unit:      'kg',
          restSeconds: 90,
        })),
      };
    }

    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;

    // ── 10 sessions over 14 days — realistic PPL split ─────────────────────
    // Day 14: Push A  Day 13: Pull A  Day 12: Legs A  Day 11: rest
    // Day 10: Push B  Day 9:  Pull B  Day 8:  Legs B  Day 7: rest
    // Day 6:  Push C  Day 5:  rest    Day 4:  Pull C  Day 3:  rest
    // Day 2:  Legs C  Day 1:  Push D  (yesterday)

    const sessions = [

      // ────────────── Day 14 ago — Push A ───────────────────────────────────
      {
        userId: req.user._id,
        date: new Date(now - 14 * DAY),
        workoutTypes: ['Chest', 'Shoulders', 'Triceps'],
        startTime: new Date(now - 14 * DAY + 7 * 3600000),
        endTime:   new Date(now - 14 * DAY + 8.4 * 3600000),
        status: 'completed',
        exercises: [
          exEntry(bench,   [s(60,12), s(70,10), s(80,8),  s(80,7)]),
          exEntry(incline, [s(50,10), s(55,9),  s(55,8)]),
          exEntry(ohp,     [s(40,12), s(45,10), s(50,8)]),
          exEntry(laterals,[s(10,15), s(10,14), s(10,12)]),
          exEntry(tricep,  [s(25,12), s(27.5,11), s(27.5,10)]),
        ],
      },

      // ────────────── Day 13 ago — Pull A ───────────────────────────────────
      {
        userId: req.user._id,
        date: new Date(now - 13 * DAY),
        workoutTypes: ['Back', 'Biceps'],
        startTime: new Date(now - 13 * DAY + 18 * 3600000),
        endTime:   new Date(now - 13 * DAY + 19.5 * 3600000),
        status: 'completed',
        exercises: [
          exEntry(pullup,  [s(0,8), s(0,7), s(0,6), s(0,5)]),
          exEntry(row,     [s(60,10), s(65,9), s(70,8)]),
          exEntry(facepull,[s(20,15), s(20,14), s(20,12)]),
          exEntry(curl,    [s(30,12), s(32.5,10), s(32.5,9)]),
          exEntry(hamcurl, [s(14,12), s(14,11), s(14,10)]),
        ],
      },

      // ────────────── Day 12 ago — Legs A ───────────────────────────────────
      {
        userId: req.user._id,
        date: new Date(now - 12 * DAY),
        workoutTypes: ['Legs', 'Glutes'],
        startTime: new Date(now - 12 * DAY + 7.5 * 3600000),
        endTime:   new Date(now - 12 * DAY + 9 * 3600000),
        status: 'completed',
        exercises: [
          exEntry(squat,   [s(80,10), s(90,8),  s(95,6),  s(95,6)]),
          exEntry(rdl,     [s(70,10), s(75,9),  s(80,8)]),
          exEntry(legpress,[s(120,12),s(130,10),s(140,9)]),
          exEntry(lunge,   [s(25,10), s(25,10), s(25,9)]),
          exEntry(calf,    [s(80,15), s(80,15), s(80,12)]),
        ],
      },

      // ────────────── Day 10 ago — Push B (slight progression) ──────────────
      {
        userId: req.user._id,
        date: new Date(now - 10 * DAY),
        workoutTypes: ['Chest', 'Shoulders', 'Triceps'],
        startTime: new Date(now - 10 * DAY + 7 * 3600000),
        endTime:   new Date(now - 10 * DAY + 8.5 * 3600000),
        status: 'completed',
        exercises: [
          exEntry(bench,   [s(62.5,12), s(72.5,10), s(82.5,8), s(82.5,7)]),
          exEntry(incline, [s(52.5,10), s(57.5,9),  s(57.5,8)]),
          exEntry(ohp,     [s(42.5,12), s(47.5,10), s(52.5,7)]),
          exEntry(laterals,[s(10,15),   s(12,14),   s(12,12)]),
          exEntry(front,   [s(8,12),    s(8,12),    s(8,10)]),
          exEntry(tricep,  [s(27.5,12), s(30,10),   s(30,9)]),
        ],
      },

      // ────────────── Day 9 ago — Pull B ────────────────────────────────────
      {
        userId: req.user._id,
        date: new Date(now - 9 * DAY),
        workoutTypes: ['Back', 'Biceps'],
        startTime: new Date(now - 9 * DAY + 18.5 * 3600000),
        endTime:   new Date(now - 9 * DAY + 20 * 3600000),
        status: 'completed',
        exercises: [
          exEntry(pullup,  [s(0,9), s(0,8), s(0,7), s(0,6)]),
          exEntry(row,     [s(62.5,10), s(67.5,9), s(72.5,8)]),
          exEntry(facepull,[s(22.5,15), s(22.5,14), s(22.5,12)]),
          exEntry(curl,    [s(32.5,12), s(35,10),   s(35,9)]),
          exEntry(hamcurl, [s(14,12),   s(16,11),   s(16,10)]),
        ],
      },

      // ────────────── Day 8 ago — Legs B ────────────────────────────────────
      {
        userId: req.user._id,
        date: new Date(now - 8 * DAY),
        workoutTypes: ['Legs', 'Glutes'],
        startTime: new Date(now - 8 * DAY + 7 * 3600000),
        endTime:   new Date(now - 8 * DAY + 8.75 * 3600000),
        status: 'completed',
        exercises: [
          exEntry(squat,   [s(82.5,10), s(92.5,8),  s(97.5,6), s(97.5,5)]),
          exEntry(rdl,     [s(72.5,10), s(77.5,9),  s(82.5,8)]),
          exEntry(legpress,[s(125,12),  s(135,10),  s(145,8)]),
          exEntry(lunge,   [s(27.5,10), s(27.5,10), s(27.5,8)]),
          exEntry(calf,    [s(85,15),   s(85,15),   s(85,13)]),
        ],
      },

      // ────────────── Day 6 ago — Push C ────────────────────────────────────
      {
        userId: req.user._id,
        date: new Date(now - 6 * DAY),
        workoutTypes: ['Chest', 'Shoulders', 'Triceps'],
        startTime: new Date(now - 6 * DAY + 8 * 3600000),
        endTime:   new Date(now - 6 * DAY + 9.5 * 3600000),
        status: 'completed',
        exercises: [
          exEntry(bench,   [s(65,12), s(75,10), s(85,7), s(85,6)]),
          exEntry(incline, [s(55,10), s(60,9),  s(60,7)]),
          exEntry(chest3,  [s(20,15), s(20,14), s(20,12)]),
          exEntry(ohp,     [s(45,12), s(50,9),  s(55,7)]),
          exEntry(laterals,[s(12,15), s(12,14), s(12,12)]),
          exEntry(tricep,  [s(30,12), s(32.5,10), s(32.5,8)]),
        ],
      },

      // ────────────── Day 4 ago — Pull C ────────────────────────────────────
      {
        userId: req.user._id,
        date: new Date(now - 4 * DAY),
        workoutTypes: ['Back', 'Biceps'],
        startTime: new Date(now - 4 * DAY + 18 * 3600000),
        endTime:   new Date(now - 4 * DAY + 19.5 * 3600000),
        status: 'completed',
        exercises: [
          exEntry(deadlift,[s(100,5), s(110,5), s(120,4), s(120,3)]),
          exEntry(pullup,  [s(0,10),  s(0,8),   s(0,7),   s(0,6)]),
          exEntry(row,     [s(65,10), s(70,9),  s(75,7)]),
          exEntry(curl,    [s(35,12), s(37.5,10), s(37.5,8)]),
        ],
      },

      // ────────────── Day 2 ago — Legs C (PR day) ────────────────────────────
      {
        userId: req.user._id,
        date: new Date(now - 2 * DAY),
        workoutTypes: ['Legs', 'Glutes'],
        startTime: new Date(now - 2 * DAY + 7 * 3600000),
        endTime:   new Date(now - 2 * DAY + 9 * 3600000),
        status: 'completed',
        exercises: [
          exEntry(squat,   [s(80,10), s(90,8), s(100,6), s(105,4)]),
          exEntry(rdl,     [s(75,10), s(80,9), s(85,7)]),
          exEntry(legpress,[s(130,12),s(140,10),s(150,8)]),
          exEntry(lunge,   [s(30,10), s(30,10), s(30,8)]),
          exEntry(calf,    [s(90,15), s(90,15), s(90,13)]),
        ],
      },

      // ────────────── Yesterday — Push D ────────────────────────────────────
      {
        userId: req.user._id,
        date: new Date(now - 1 * DAY),
        workoutTypes: ['Chest', 'Shoulders', 'Triceps'],
        startTime: new Date(now - 1 * DAY + 7 * 3600000),
        endTime:   new Date(now - 1 * DAY + 8.5 * 3600000),
        status: 'completed',
        exercises: [
          exEntry(bench,   [s(67.5,12), s(77.5,10), s(87.5,7), s(87.5,6)]),
          exEntry(incline, [s(57.5,10), s(62.5,9),  s(62.5,7)]),
          exEntry(ohp,     [s(47.5,12), s(52.5,9),  s(57.5,6)]),
          exEntry(laterals,[s(12,15),   s(14,13),   s(14,12)]),
          exEntry(tricep,  [s(32.5,12), s(35,10),   s(35,8)]),
        ],
      },
    ];

    // Delete ALL sessions for this user, then insert fresh demo data
    await WorkoutSession.deleteMany({ userId: req.user._id });
    const created = await WorkoutSession.insertMany(sessions);
    res.json({ message: `Created ${created.length} demo sessions`, count: created.length });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
