'use server';

import { cookies } from 'next/headers';

export async function getCookie(name: string) {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(name)?.value;
  } catch (error) {
    console.error('Error getting cookie:', error);
    return null;
  }
}

export async function setCookie(name: string, value: string, options = {}) {
  try {
    const cookieStore = await cookies();
    cookieStore.set(name, value, options);
  } catch (error) {
    console.error('Error setting cookie:', error);
  }
}

export async function deleteCookie(name: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(name);
  } catch (error) {
    console.error('Error deleting cookie:', error);
  }
}