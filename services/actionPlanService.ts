import { Type } from '@google/genai';
import { ValueEntry, PlanDay, DayCheckIn } from '../types';
import { getClient } from './geminiService';

const actionPlanSchema = {
  type: Type.OBJECT,
  properties: {
    days: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.NUMBER },
          theme: { type: Type.STRING },
          actions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                valueTag: { type: Type.STRING },
                durationMinutes: { type: Type.NUMBER },
                rationale: { type: Type.STRING },
              },
              required: ['title', 'valueTag', 'durationMinutes', 'rationale'],
            },
          },
        },
        required: ['day', 'theme', 'actions'],
      },
    },
  },
  required: ['days'],
};

const clampDuration = (minutes: number): 5 | 15 | 30 => {
  if (minutes <= 10) return 5;
  if (minutes <= 20) return 15;
  return 30;
};

const asPlanDays = (days: any[], fallbackValues: string[]): PlanDay[] => {
  return days.slice(0, 7).map((day, index) => ({
    day: Math.max(1, Math.min(7, Number(day.day || index + 1))),
    theme: day.theme || `Day ${index + 1}`,
    actions: (day.actions || []).slice(0, 2).map((action: any, actionIndex: number) => ({
      id: `d${index + 1}_a${actionIndex + 1}_${Date.now()}`,
      title: action.title || `Practice ${fallbackValues[index % fallbackValues.length] || 'Focus'}`,
      valueTag: action.valueTag || fallbackValues[index % fallbackValues.length] || 'Focus',
      durationMinutes: clampDuration(Number(action.durationMinutes || 15)),
      rationale: action.rationale || 'Small repeated action builds identity-level change.',
    })),
  }));
};

const fallbackPlan = (values: string[]): PlanDay[] => {
  const normalized = values.length ? values : ['Focus', 'Consistency'];
  return Array.from({ length: 7 }, (_, i) => ({
    day: i + 1,
    theme: `Day ${i + 1}: ${normalized[i % normalized.length]} in action`,
    actions: [
      {
        id: `fallback_${i + 1}_1`,
        title: `Do one 15-minute action that demonstrates ${normalized[i % normalized.length]}`,
        valueTag: normalized[i % normalized.length],
        durationMinutes: 15,
        rationale: 'Daily repetitions convert values into observable behavior.',
      },
      {
        id: `fallback_${i + 1}_2`,
        title: `Write one sentence on how today's behavior reflected ${normalized[(i + 1) % normalized.length]}`,
        valueTag: normalized[(i + 1) % normalized.length],
        durationMinutes: 5,
        rationale: 'Short reflection reinforces intentional choices.',
      },
    ],
  }));
};

const summarizeCheckIns = (checkIns: Record<number, DayCheckIn | undefined>): string => {
  return Object.entries(checkIns)
    .filter(([, checkIn]) => checkIn)
    .map(([day, checkIn]) => {
      const note = checkIn?.note ? ` | note: ${checkIn.note}` : '';
      return `Day ${day}: ${checkIn?.status}${note}`;
    })
    .join('\n');
};

export const deriveTopValues = (entries: ValueEntry[], limit = 3): string[] => {
  const counts = entries.reduce((acc, entry) => {
    acc[entry.value] = (acc[entry.value] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value]) => value);
};

export const generateActionPlan = async (
  entries: ValueEntry[],
  selectedValues: string[],
  options?: { fromDay?: number; priorCheckIns?: Record<number, DayCheckIn | undefined> }
): Promise<PlanDay[]> => {
  const client = getClient();
  const fromDay = options?.fromDay || 1;

  const context = entries
    .slice(-25)
    .map((entry) => `- ${entry.value} from "${entry.sourceAction}" (${entry.pillar})`)
    .join('\n');

  const checkInContext = summarizeCheckIns(options?.priorCheckIns || {});

  const prompt = `
Create a 7-day behavior plan for a user based on these embodied values: ${selectedValues.join(', ')}.

Rules:
- Return days ${fromDay} through 7 only.
- 1-2 actions per day.
- Actions must be specific, observable, and completable in 5, 15, or 30 minutes.
- Use valueTag from selected values when possible.
- Keep wording practical and short.

Recent evidence:
${context}

Prior check-ins (if any):
${checkInContext || 'No prior check-ins'}
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: actionPlanSchema,
        temperature: 0.5,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const parsedDays = asPlanDays(parsed.days || [], selectedValues).sort((a, b) => a.day - b.day);

    if (!parsedDays.length) {
      return fallbackPlan(selectedValues).slice(fromDay - 1);
    }

    return parsedDays.filter((day) => day.day >= fromDay);
  } catch {
    return fallbackPlan(selectedValues).slice(fromDay - 1);
  }
};
