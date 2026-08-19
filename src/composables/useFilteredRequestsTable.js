import { ref, computed, watch } from 'vue'
import { getPaginatedRequests } from '@/services/rest/adminRequestService.js'
import { useToast } from 'vue-toastification'

function currentYearBounds() {
  const year = new Date().getFullYear()
  return {
    from: `${year}-01-01`,
    to: `${year}-12-31`
  }
}

function compareValues(a, b) {
  if (a == null && b == null) return 0
  if (a == null) return -1
  if (b == null) return 1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b))
}

/**
 * Shared date-filter/fetch/sort state for the admin request tables (All requests,
 * Statistics). Fetches every matching request in one unpaged call rather than
 * paginating, refetched whenever the status or date filters change. Sorting is
 * done client-side over the fetched set, since one of the sortable columns
 * (mushroom count) isn't a real column on the backend entity.
 *
 * @param status a ref holding the status to filter by, or null for no status filter
 * @param exclude a ref holding whether `status` should be excluded instead of required
 * @returns reactive table state and controls
 */
export function useFilteredRequestsTable({ status = ref(null), exclude = ref(false) } = {}) {
  const toast = useToast()
  const { from: defaultFrom, to: defaultTo } = currentYearBounds()

  const rawItems = ref([])
  const loading = ref(false)
  const dateFrom = ref(defaultFrom)
  const dateTo = ref(defaultTo)
  const sortKey = ref('updatedAt')
  const sortDirection = ref('desc')

  const fetchItems = async () => {
    loading.value = true
    try {
      const res = await getPaginatedRequests({
        status: status.value,
        exclude: exclude.value,
        from: dateFrom.value || null,
        to: dateTo.value || null,
        unpaged: true
      })
      rawItems.value = res.content
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast.error('Error fetching requests')
    } finally {
      loading.value = false
    }
  }

  const items = computed(() => {
    const sorted = [...rawItems.value]
    sorted.sort((a, b) => {
      const result = compareValues(a[sortKey.value], b[sortKey.value])
      return sortDirection.value === 'asc' ? result : -result
    })
    return sorted
  })

  const toggleSort = (key) => {
    if (sortKey.value === key) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey.value = key
      sortDirection.value = 'asc'
    }
  }

  watch([status, exclude, dateFrom, dateTo], fetchItems)

  return { items, loading, dateFrom, dateTo, sortKey, sortDirection, fetchItems, toggleSort }
}
