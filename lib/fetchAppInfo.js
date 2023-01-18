/**
 * Retries on taking app info from backend
 * @param {number} retry number of remaining retries
 * @returns {Promise<import('./src/api/types').AppInfo>}
 */
const fetchAppInfo = async (retry = 5) => {
  const res = await fetch(process.env.NEXT_PUBLIC_BASE_URL + "/api/app-info")

  if (res.ok) {
    return (await res.json()).data["app-info"]
  } else {
    if (retry === 0) {
      throw "Failed to receive app info."
    }
    try {
      console.log("\x1b[31m%s\x1b[0m", "app info failed. retrying...")
      return await fetchAppInfo(retry - 1)
    } catch (e) {
      throw e
    }
  }
}

module.exports = fetchAppInfo
