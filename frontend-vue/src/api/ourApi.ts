/*
 * This file is used to fetch data from the API
 * It is used to fetch the TLE data and categories
 * It also has a cache system to store the data for 1 hour
 */

import { API_URL } from '@/common/config'

export interface API_TLE_DATA {
  name: string
  line1: string
  line2: string
  launch_year: number
  country: string
  categories: string[]
  // ....
}

const cacheKey = 'tle-cache'

function getCache(key: string) {
  const currentDate = new Date()
  const expiry = localStorage.getItem(`${key}-expiry-${import.meta.url}`)

  if (expiry && new Date(expiry) > currentDate) {
    const data = localStorage.getItem(key)
    if (data) {
      return JSON.parse(data)
    }
  }
  return null
}

function setCache(key: string, cache: object) {
  localStorage.setItem(key, JSON.stringify(cache))
  const expiry = new Date()
  expiry.setHours(expiry.getHours() + 1)
  localStorage.setItem(`${key}-expiry-${import.meta.url}`, expiry.toISOString())
}

export async function fetchTLEInformation(): Promise<API_TLE_DATA[]> {
  const cache = getCache(cacheKey) as API_TLE_DATA[] | null
  if (cache) {
    return cache
  }

  const response = await fetch(`${API_URL}satellite_app/?limit=20000`)
  const rawData = await response.json()
  const data = rawData.satellites as API_TLE_DATA[]

  setCache(cacheKey, data)
  return data
}

export async function getRawTLES(limit: number | undefined = undefined): Promise<string> {
  const data = await fetchTLEInformation()
  return data
    .map((x) => {
      return `${x.name}\n${x.line1}\n${x.line2}`
    })
    .slice(0, limit)
    .join('\n')
}

export async function getAllCategories(): Promise<string[]> {
  const data = await fetch(`${API_URL}satellite_app/categories`)
  const json = await data.json()

  return json.categories
}
