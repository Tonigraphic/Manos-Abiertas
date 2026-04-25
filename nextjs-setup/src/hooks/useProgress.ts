import useSWR from 'swr';
import { api, endpoints } from '@/lib/api';
import type { UserProgress, Exercise } from '@/types';

const fetcher = async (url: string) => {
  const response = await api.get(url);
  return response.data;
};

export function useProgress() {
  const { data, error, isLoading, mutate } = useSWR<UserProgress>(
    endpoints.getUserProgress,
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );

  return {
    progress: data,
    isLoading,
    error,
    mutate,
  };
}

export function useExercises() {
  const { data, error, isLoading } = useSWR<Exercise[]>(
    endpoints.getExercises,
    fetcher
  );

  return {
    exercises: data || [],
    isLoading,
    error,
  };
}

export function useExercise(exerciseId: string | null) {
  const { data, error, isLoading } = useSWR<Exercise>(
    exerciseId ? endpoints.getExerciseById(exerciseId) : null,
    fetcher
  );

  return {
    exercise: data,
    isLoading,
    error,
  };
}

export async function submitExerciseResult(
  exerciseId: string,
  answers: any,
  accuracy: number
) {
  try {
    const response = await api.post(endpoints.submitExercise, {
      exerciseId,
      answers,
      accuracy,
      completedAt: new Date().toISOString(),
    });

    return response.data;
  } catch (error) {
    console.error('Error submitting exercise:', error);
    throw error;
  }
}
