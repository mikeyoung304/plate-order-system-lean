window.jest_html_reporters_callback__({
  numFailedTestSuites: 8,
  numFailedTests: 139,
  numPassedTestSuites: 1,
  numPassedTests: 68,
  numPendingTestSuites: 0,
  numPendingTests: 0,
  numRuntimeErrorTestSuites: 0,
  numTodoTests: 0,
  numTotalTestSuites: 9,
  numTotalTests: 207,
  startTime: 1749868557114,
  success: false,
  testResults: [
    {
      numFailingTests: 10,
      numPassingTests: 1,
      numPendingTests: 0,
      numTodoTests: 0,
      perfStats: {
        end: 1749868558102,
        runtime: 492,
        slow: false,
        start: 1749868557610,
      },
      testFilePath:
        '/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/voice-ordering/transcription-cache.test.ts',
      failureMessage:
        "  ● TranscriptionCache › Audio Hash Generation › should generate consistent hashes for identical audio\n\n    TypeError: Cannot read properties of undefined (reading 'digest')\n\n      440 | export async function generateAudioHash(blob: Blob): Promise<string> {\n      441 |   const arrayBuffer = await blob.arrayBuffer()\n    > 442 |   const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)\n          |                                          ^\n      443 |   const hashArray = Array.from(new Uint8Array(hashBuffer))\n      444 |   return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')\n      445 | }\n\n      at digest (lib/modassembly/openai/transcription-cache.ts:442:42)\n      at Object.<anonymous> (__tests__/unit/lib/voice-ordering/transcription-cache.test.ts:86:21)\n\n  ● TranscriptionCache › Audio Hash Generation › should generate different hashes for different audio\n\n    TypeError: Cannot read properties of undefined (reading 'digest')\n\n      440 | export async function generateAudioHash(blob: Blob): Promise<string> {\n      441 |   const arrayBuffer = await blob.arrayBuffer()\n    > 442 |   const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)\n          |                                          ^\n      443 |   const hashArray = Array.from(new Uint8Array(hashBuffer))\n      444 |   return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')\n      445 | }\n\n      at digest (lib/modassembly/openai/transcription-cache.ts:442:42)\n      at Object.<anonymous> (__tests__/unit/lib/voice-ordering/transcription-cache.test.ts:99:21)\n\n  ● TranscriptionCache › Cache Operations › should store and retrieve cached transcriptions\n\n    TypeError: Cannot read properties of undefined (reading 'digest')\n\n      440 | export async function generateAudioHash(blob: Blob): Promise<string> {\n      441 |   const arrayBuffer = await blob.arrayBuffer()\n    > 442 |   const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)\n          |                                          ^\n      443 |   const hashArray = Array.from(new Uint8Array(hashBuffer))\n      444 |   return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')\n      445 | }\n\n      at digest (lib/modassembly/openai/transcription-cache.ts:442:42)\n      at Object.<anonymous> (__tests__/unit/lib/voice-ordering/transcription-cache.test.ts:114:25)\n\n  ● TranscriptionCache › Cache Operations › should not cache low confidence transcriptions\n\n    TypeError: Cannot read properties of undefined (reading 'digest')\n\n      440 | export async function generateAudioHash(blob: Blob): Promise<string> {\n      441 |   const arrayBuffer = await blob.arrayBuffer()\n    > 442 |   const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)\n          |                                          ^\n      443 |   const hashArray = Array.from(new Uint8Array(hashBuffer))\n      444 |   return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')\n      445 | }\n\n      at digest (lib/modassembly/openai/transcription-cache.ts:442:42)\n      at Object.<anonymous> (__tests__/unit/lib/voice-ordering/transcription-cache.test.ts:133:25)\n\n  ● TranscriptionCache › Cache Operations › should update usage statistics on cache hits\n\n    TypeError: Cannot read properties of undefined (reading 'digest')\n\n      440 | export async function generateAudioHash(blob: Blob): Promise<string> {\n      441 |   const arrayBuffer = await blob.arrayBuffer()\n    > 442 |   const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)\n          |                                          ^\n      443 |   const hashArray = Array.from(new Uint8Array(hashBuffer))\n      444 |   return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')\n      445 | }\n\n      at digest (lib/modassembly/openai/transcription-cache.ts:442:42)\n      at Object.<anonymous> (__tests__/unit/lib/voice-ordering/transcription-cache.test.ts:143:25)\n\n  ● TranscriptionCache › Similarity Matching › should find similar audio files\n\n    TypeError: Cannot read properties of undefined (reading 'digest')\n\n      440 | export async function generateAudioHash(blob: Blob): Promise<string> {\n      441 |   const arrayBuffer = await blob.arrayBuffer()\n    > 442 |   const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)\n          |                                          ^\n      443 |   const hashArray = Array.from(new Uint8Array(hashBuffer))\n      444 |   return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')\n      445 | }\n\n      at digest (lib/modassembly/openai/transcription-cache.ts:442:42)\n      at Object.<anonymous> (__tests__/unit/lib/voice-ordering/transcription-cache.test.ts:167:21)\n\n  ● TranscriptionCache › Cache Statistics › should provide accurate cache statistics\n\n    TypeError: Cannot read properties of undefined (reading 'digest')\n\n      440 | export async function generateAudioHash(blob: Blob): Promise<string> {\n      441 |   const arrayBuffer = await blob.arrayBuffer()\n    > 442 |   const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)\n          |                                          ^\n      443 |   const hashArray = Array.from(new Uint8Array(hashBuffer))\n      444 |   return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')\n      445 | }\n\n      at digest (lib/modassembly/openai/transcription-cache.ts:442:42)\n      at Object.<anonymous> (__tests__/unit/lib/voice-ordering/transcription-cache.test.ts:189:22)\n\n  ● TranscriptionCache › Cache Performance › should achieve target cache hit rate >85%\n\n    TypeError: Cannot read properties of undefined (reading 'digest')\n\n      440 | export async function generateAudioHash(blob: Blob): Promise<string> {\n      441 |   const arrayBuffer = await blob.arrayBuffer()\n    > 442 |   const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)\n          |                                          ^\n      443 |   const hashArray = Array.from(new Uint8Array(hashBuffer))\n      444 |   return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')\n      445 | }\n\n      at digest (lib/modassembly/openai/transcription-cache.ts:442:42)\n      at Object.<anonymous> (__tests__/unit/lib/voice-ordering/transcription-cache.test.ts:216:22)\n\n  ● TranscriptionCache › Cache Performance › should have fast cache lookup times\n\n    TypeError: Cannot read properties of undefined (reading 'digest')\n\n      440 | export async function generateAudioHash(blob: Blob): Promise<string> {\n      441 |   const arrayBuffer = await blob.arrayBuffer()\n    > 442 |   const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)\n          |                                          ^\n      443 |   const hashArray = Array.from(new Uint8Array(hashBuffer))\n      444 |   return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')\n      445 | }\n\n      at digest (lib/modassembly/openai/transcription-cache.ts:442:42)\n      at Object.<anonymous> (__tests__/unit/lib/voice-ordering/transcription-cache.test.ts:252:20)\n\n  ● TranscriptionCache › Cost Efficiency › should calculate cost savings correctly\n\n    TypeError: Cannot read properties of undefined (reading 'digest')\n\n      440 | export async function generateAudioHash(blob: Blob): Promise<string> {\n      441 |   const arrayBuffer = await blob.arrayBuffer()\n    > 442 |   const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)\n          |                                          ^\n      443 |   const hashArray = Array.from(new Uint8Array(hashBuffer))\n      444 |   return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')\n      445 | }\n\n      at digest (lib/modassembly/openai/transcription-cache.ts:442:42)\n      at Object.<anonymous> (__tests__/unit/lib/voice-ordering/transcription-cache.test.ts:272:20)\n",
      testResults: [
        {
          ancestorTitles: ['TranscriptionCache', 'Audio Hash Generation'],
          duration: 10,
          failureMessages: [
            "TypeError: Cannot read properties of undefined (reading 'digest')\n    at digest (/Users/mike/Plate-Restaurant-System-App/lib/modassembly/openai/transcription-cache.ts:442:42)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/voice-ordering/transcription-cache.test.ts:86:21)",
          ],
          fullName:
            'TranscriptionCache Audio Hash Generation should generate consistent hashes for identical audio',
          status: 'failed',
          title: 'should generate consistent hashes for identical audio',
        },
        {
          ancestorTitles: ['TranscriptionCache', 'Audio Hash Generation'],
          duration: 2,
          failureMessages: [
            "TypeError: Cannot read properties of undefined (reading 'digest')\n    at digest (/Users/mike/Plate-Restaurant-System-App/lib/modassembly/openai/transcription-cache.ts:442:42)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/voice-ordering/transcription-cache.test.ts:99:21)",
          ],
          fullName:
            'TranscriptionCache Audio Hash Generation should generate different hashes for different audio',
          status: 'failed',
          title: 'should generate different hashes for different audio',
        },
        {
          ancestorTitles: ['TranscriptionCache', 'Cache Operations'],
          duration: 0,
          failureMessages: [
            "TypeError: Cannot read properties of undefined (reading 'digest')\n    at digest (/Users/mike/Plate-Restaurant-System-App/lib/modassembly/openai/transcription-cache.ts:442:42)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/voice-ordering/transcription-cache.test.ts:114:25)",
          ],
          fullName:
            'TranscriptionCache Cache Operations should store and retrieve cached transcriptions',
          status: 'failed',
          title: 'should store and retrieve cached transcriptions',
        },
        {
          ancestorTitles: ['TranscriptionCache', 'Cache Operations'],
          duration: 0,
          failureMessages: [
            "TypeError: Cannot read properties of undefined (reading 'digest')\n    at digest (/Users/mike/Plate-Restaurant-System-App/lib/modassembly/openai/transcription-cache.ts:442:42)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/voice-ordering/transcription-cache.test.ts:133:25)",
          ],
          fullName:
            'TranscriptionCache Cache Operations should not cache low confidence transcriptions',
          status: 'failed',
          title: 'should not cache low confidence transcriptions',
        },
        {
          ancestorTitles: ['TranscriptionCache', 'Cache Operations'],
          duration: 0,
          failureMessages: [
            "TypeError: Cannot read properties of undefined (reading 'digest')\n    at digest (/Users/mike/Plate-Restaurant-System-App/lib/modassembly/openai/transcription-cache.ts:442:42)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/voice-ordering/transcription-cache.test.ts:143:25)",
          ],
          fullName:
            'TranscriptionCache Cache Operations should update usage statistics on cache hits',
          status: 'failed',
          title: 'should update usage statistics on cache hits',
        },
        {
          ancestorTitles: ['TranscriptionCache', 'Similarity Matching'],
          duration: 1,
          failureMessages: [
            "TypeError: Cannot read properties of undefined (reading 'digest')\n    at digest (/Users/mike/Plate-Restaurant-System-App/lib/modassembly/openai/transcription-cache.ts:442:42)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/voice-ordering/transcription-cache.test.ts:167:21)",
          ],
          fullName:
            'TranscriptionCache Similarity Matching should find similar audio files',
          status: 'failed',
          title: 'should find similar audio files',
        },
        {
          ancestorTitles: ['TranscriptionCache', 'Cache Statistics'],
          duration: 0,
          failureMessages: [
            "TypeError: Cannot read properties of undefined (reading 'digest')\n    at digest (/Users/mike/Plate-Restaurant-System-App/lib/modassembly/openai/transcription-cache.ts:442:42)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/voice-ordering/transcription-cache.test.ts:189:22)",
          ],
          fullName:
            'TranscriptionCache Cache Statistics should provide accurate cache statistics',
          status: 'failed',
          title: 'should provide accurate cache statistics',
        },
        {
          ancestorTitles: ['TranscriptionCache', 'Cache Performance'],
          duration: 1,
          failureMessages: [
            "TypeError: Cannot read properties of undefined (reading 'digest')\n    at digest (/Users/mike/Plate-Restaurant-System-App/lib/modassembly/openai/transcription-cache.ts:442:42)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/voice-ordering/transcription-cache.test.ts:216:22)",
          ],
          fullName:
            'TranscriptionCache Cache Performance should achieve target cache hit rate >85%',
          status: 'failed',
          title: 'should achieve target cache hit rate >85%',
        },
        {
          ancestorTitles: ['TranscriptionCache', 'Cache Performance'],
          duration: 1,
          failureMessages: [
            "TypeError: Cannot read properties of undefined (reading 'digest')\n    at digest (/Users/mike/Plate-Restaurant-System-App/lib/modassembly/openai/transcription-cache.ts:442:42)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/voice-ordering/transcription-cache.test.ts:252:20)",
          ],
          fullName:
            'TranscriptionCache Cache Performance should have fast cache lookup times',
          status: 'failed',
          title: 'should have fast cache lookup times',
        },
        {
          ancestorTitles: ['TranscriptionCache', 'Cost Efficiency'],
          duration: 0,
          failureMessages: [
            "TypeError: Cannot read properties of undefined (reading 'digest')\n    at digest (/Users/mike/Plate-Restaurant-System-App/lib/modassembly/openai/transcription-cache.ts:442:42)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/voice-ordering/transcription-cache.test.ts:272:20)",
          ],
          fullName:
            'TranscriptionCache Cost Efficiency should calculate cost savings correctly',
          status: 'failed',
          title: 'should calculate cost savings correctly',
        },
        {
          ancestorTitles: ['TranscriptionCache', 'Cost Efficiency'],
          duration: 3,
          failureMessages: [],
          fullName:
            'TranscriptionCache Cost Efficiency should estimate cache value correctly',
          status: 'passed',
          title: 'should estimate cache value correctly',
        },
      ],
    },
    {
      numFailingTests: 13,
      numPassingTests: 10,
      numPendingTests: 0,
      numTodoTests: 0,
      perfStats: {
        end: 1749868558305,
        runtime: 691,
        slow: false,
        start: 1749868557614,
      },
      testFilePath:
        '/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/modassembly/supabase/database/suggestions.test.ts',
      failureMessage:
        "  ● Order Suggestions › getOrderSuggestions › groups identical order combinations and counts frequency\n\n    expect(received).toHaveLength(expected)\n\n    Expected length: 3\n    Received length: 0\n    Received array:  []\n\n      67 |       const result = await getOrderSuggestions('user-id', 'food', 5)\n      68 |\n    > 69 |       expect(result).toHaveLength(3)\n         |                      ^\n      70 |       \n      71 |       // Most frequent should be first (chicken, pasta appears 3 times)\n      72 |       expect(result[0]).toEqual({\n\n      at Object.toHaveLength (__tests__/unit/lib/modassembly/supabase/database/suggestions.test.ts:69:22)\n\n  ● Order Suggestions › getOrderSuggestions › sorts items within each suggestion consistently\n\n    expect(received).toHaveLength(expected)\n\n    Expected length: 1\n    Received length: 0\n    Received array:  []\n\n      100 |       const result = await getOrderSuggestions('user-id', 'food', 5)\n      101 |\n    > 102 |       expect(result).toHaveLength(1)\n          |                      ^\n      103 |       expect(result[0]).toEqual({\n      104 |         items: ['chicken', 'pasta'], // Should be sorted alphabetically\n      105 |         frequency: 2,\n\n      at Object.toHaveLength (__tests__/unit/lib/modassembly/supabase/database/suggestions.test.ts:102:22)\n\n  ● Order Suggestions › getOrderSuggestions › filters out invalid order items\n\n    expect(received).toHaveLength(expected)\n\n    Expected length: 1\n    Received length: 0\n    Received array:  []\n\n      120 |       const result = await getOrderSuggestions('user-id', 'food', 5)\n      121 |\n    > 122 |       expect(result).toHaveLength(1)\n          |                      ^\n      123 |       expect(result[0]).toEqual({\n      124 |         items: ['chicken', 'pasta'],\n      125 |         frequency: 1,\n\n      at Object.toHaveLength (__tests__/unit/lib/modassembly/supabase/database/suggestions.test.ts:122:22)\n\n  ● Order Suggestions › getOrderSuggestions › respects the limit parameter\n\n    expect(received).toHaveLength(expected)\n\n    Expected length: 2\n    Received length: 0\n    Received array:  []\n\n      130 |       const result = await getOrderSuggestions('user-id', 'food', 2)\n      131 |\n    > 132 |       expect(result).toHaveLength(2)\n          |                      ^\n      133 |       expect(result[0].frequency).toBeGreaterThanOrEqual(result[1].frequency)\n      134 |     })\n      135 |\n\n      at Object.toHaveLength (__tests__/unit/lib/modassembly/supabase/database/suggestions.test.ts:132:22)\n\n  ● Order Suggestions › getOrderSuggestions › handles minimum limit of 1\n\n    expect(received).toHaveLength(expected)\n\n    Expected length: 1\n    Received length: 0\n    Received array:  []\n\n      137 |       const result = await getOrderSuggestions('user-id', 'food', 0)\n      138 |\n    > 139 |       expect(result).toHaveLength(1) // Should return at least 1\n          |                      ^\n      140 |     })\n      141 |\n      142 |     it('handles maximum limit of 10', async () => {\n\n      at Object.toHaveLength (__tests__/unit/lib/modassembly/supabase/database/suggestions.test.ts:139:22)\n\n  ● Order Suggestions › getOrderSuggestions › uses correct query parameters\n\n    expect(jest.fn()).toHaveBeenCalledWith(...expected)\n\n    Expected: \"items\"\n\n    Number of calls: 0\n\n      150 |\n      151 |       expect(mockSupabase.from).toHaveBeenCalledWith('orders')\n    > 152 |       expect(mockSupabase.from().select).toHaveBeenCalledWith('items')\n          |                                          ^\n      153 |       expect(mockSupabase.from().select().eq).toHaveBeenNthCalledWith(1, 'resident_id', 'test-user-id')\n      154 |       expect(mockSupabase.from().select().eq().eq).toHaveBeenCalledWith('type', 'drink')\n      155 |       expect(mockSupabase.from().select().eq().eq().order).toHaveBeenCalledWith('created_at', { ascending: false })\n\n      at Object.toHaveBeenCalledWith (__tests__/unit/lib/modassembly/supabase/database/suggestions.test.ts:152:42)\n\n  ● Order Suggestions › getOrderSuggestions › defaults to food type when no type specified\n\n    expect(jest.fn()).toHaveBeenCalledWith(...expected)\n\n    Expected: \"type\", \"food\"\n    Received: called with 0 arguments\n\n    Number of calls: 1\n\n      160 |       await getOrderSuggestions('test-user-id')\n      161 |\n    > 162 |       expect(mockSupabase.from().select().eq().eq).toHaveBeenCalledWith('type', 'food')\n          |                                                    ^\n      163 |     })\n      164 |\n      165 |     it('defaults to limit of 5 when no limit specified', async () => {\n\n      at Object.toHaveBeenCalledWith (__tests__/unit/lib/modassembly/supabase/database/suggestions.test.ts:162:52)\n\n  ● Order Suggestions › getPopularItems › counts individual item frequency correctly\n\n    expect(received).toHaveLength(expected)\n\n    Expected length: 6\n    Received length: 0\n    Received array:  []\n\n      224 |       // wings: 1 time\n      225 |\n    > 226 |       expect(result).toHaveLength(6)\n          |                      ^\n      227 |       expect(result[0]).toBe('chicken') // Most frequent\n      228 |       expect(result.slice(1, 3)).toContain('pasta') // Second tier\n      229 |       expect(result.slice(1, 3)).toContain('salad') // Second tier\n\n      at Object.toHaveLength (__tests__/unit/lib/modassembly/supabase/database/suggestions.test.ts:226:22)\n\n  ● Order Suggestions › getPopularItems › respects the limit parameter\n\n    expect(received).toHaveLength(expected)\n\n    Expected length: 3\n    Received length: 0\n    Received array:  []\n\n      233 |       const result = await getPopularItems('food', 3)\n      234 |\n    > 235 |       expect(result).toHaveLength(3)\n          |                      ^\n      236 |       expect(result[0]).toBe('chicken') // Should still be most frequent\n      237 |     })\n      238 |\n\n      at Object.toHaveLength (__tests__/unit/lib/modassembly/supabase/database/suggestions.test.ts:235:22)\n\n  ● Order Suggestions › getPopularItems › filters out invalid items\n\n    expect(received).toEqual(expected) // deep equality\n\n    - Expected  - 5\n    + Received  + 1\n\n    - Array [\n    -   \"chicken\",\n    -   \"pasta\",\n    -   \"valid-item\",\n    - ]\n    + Array []\n\n      250 |       const result = await getPopularItems('food', 10)\n      251 |\n    > 252 |       expect(result).toEqual(['chicken', 'pasta', 'valid-item'])\n          |                      ^\n      253 |     })\n      254 |\n      255 |     it('uses correct query parameters', async () => {\n\n      at Object.toEqual (__tests__/unit/lib/modassembly/supabase/database/suggestions.test.ts:252:22)\n\n  ● Order Suggestions › getPopularItems › uses correct query parameters\n\n    expect(jest.fn()).toHaveBeenCalledWith(...expected)\n\n    Expected: \"items\"\n\n    Number of calls: 0\n\n      259 |\n      260 |       expect(mockSupabase.from).toHaveBeenCalledWith('orders')\n    > 261 |       expect(mockSupabase.from().select).toHaveBeenCalledWith('items')\n          |                                          ^\n      262 |       expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('type', 'drink')\n      263 |       expect(mockSupabase.from().select().eq().gte).toHaveBeenCalledWith(\n      264 |         'created_at',\n\n      at Object.toHaveBeenCalledWith (__tests__/unit/lib/modassembly/supabase/database/suggestions.test.ts:261:42)\n\n  ● Order Suggestions › getPopularItems › defaults to food type when no type specified\n\n    expect(jest.fn()).toHaveBeenCalledWith(...expected)\n\n    Expected: \"type\", \"food\"\n\n    Number of calls: 0\n\n      271 |       await getPopularItems()\n      272 |\n    > 273 |       expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('type', 'food')\n          |                                               ^\n      274 |     })\n      275 |\n      276 |     it('defaults to limit of 10 when no limit specified', async () => {\n\n      at Object.toHaveBeenCalledWith (__tests__/unit/lib/modassembly/supabase/database/suggestions.test.ts:273:47)\n\n  ● Order Suggestions › getPopularItems › handles date filtering correctly\n\n    TypeError: Cannot read properties of undefined (reading '1')\n\n      291 |\n      292 |       const call = mockSupabase.from().select().eq().gte.mock.calls[0]\n    > 293 |       const dateParam = call[1]\n          |                             ^\n      294 |       const providedDate = new Date(dateParam)\n      295 |       const expectedDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)\n      296 |       \n\n      at Object.<anonymous> (__tests__/unit/lib/modassembly/supabase/database/suggestions.test.ts:293:29)\n",
      testResults: [
        {
          ancestorTitles: ['Order Suggestions', 'getOrderSuggestions'],
          duration: 19,
          failureMessages: [],
          fullName:
            'Order Suggestions getOrderSuggestions returns empty array when no userId provided',
          status: 'passed',
          title: 'returns empty array when no userId provided',
        },
        {
          ancestorTitles: ['Order Suggestions', 'getOrderSuggestions'],
          duration: 5,
          failureMessages: [],
          fullName:
            'Order Suggestions getOrderSuggestions returns empty array when no orders found',
          status: 'passed',
          title: 'returns empty array when no orders found',
        },
        {
          ancestorTitles: ['Order Suggestions', 'getOrderSuggestions'],
          duration: 1,
          failureMessages: [],
          fullName:
            'Order Suggestions getOrderSuggestions returns empty array when orders data is null',
          status: 'passed',
          title: 'returns empty array when orders data is null',
        },
        {
          ancestorTitles: ['Order Suggestions', 'getOrderSuggestions'],
          duration: 2,
          failureMessages: [
            'Error: expect(received).toHaveLength(expected)\n\nExpected length: 3\nReceived length: 0\nReceived array:  []\n    at Object.toHaveLength (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/modassembly/supabase/database/suggestions.test.ts:69:22)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)',
          ],
          fullName:
            'Order Suggestions getOrderSuggestions groups identical order combinations and counts frequency',
          status: 'failed',
          title: 'groups identical order combinations and counts frequency',
        },
        {
          ancestorTitles: ['Order Suggestions', 'getOrderSuggestions'],
          duration: 1,
          failureMessages: [
            'Error: expect(received).toHaveLength(expected)\n\nExpected length: 1\nReceived length: 0\nReceived array:  []\n    at Object.toHaveLength (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/modassembly/supabase/database/suggestions.test.ts:102:22)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)',
          ],
          fullName:
            'Order Suggestions getOrderSuggestions sorts items within each suggestion consistently',
          status: 'failed',
          title: 'sorts items within each suggestion consistently',
        },
        {
          ancestorTitles: ['Order Suggestions', 'getOrderSuggestions'],
          duration: 1,
          failureMessages: [
            'Error: expect(received).toHaveLength(expected)\n\nExpected length: 1\nReceived length: 0\nReceived array:  []\n    at Object.toHaveLength (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/modassembly/supabase/database/suggestions.test.ts:122:22)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)',
          ],
          fullName:
            'Order Suggestions getOrderSuggestions filters out invalid order items',
          status: 'failed',
          title: 'filters out invalid order items',
        },
        {
          ancestorTitles: ['Order Suggestions', 'getOrderSuggestions'],
          duration: 1,
          failureMessages: [
            'Error: expect(received).toHaveLength(expected)\n\nExpected length: 2\nReceived length: 0\nReceived array:  []\n    at Object.toHaveLength (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/modassembly/supabase/database/suggestions.test.ts:132:22)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)',
          ],
          fullName:
            'Order Suggestions getOrderSuggestions respects the limit parameter',
          status: 'failed',
          title: 'respects the limit parameter',
        },
        {
          ancestorTitles: ['Order Suggestions', 'getOrderSuggestions'],
          duration: 0,
          failureMessages: [
            'Error: expect(received).toHaveLength(expected)\n\nExpected length: 1\nReceived length: 0\nReceived array:  []\n    at Object.toHaveLength (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/modassembly/supabase/database/suggestions.test.ts:139:22)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)',
          ],
          fullName:
            'Order Suggestions getOrderSuggestions handles minimum limit of 1',
          status: 'failed',
          title: 'handles minimum limit of 1',
        },
        {
          ancestorTitles: ['Order Suggestions', 'getOrderSuggestions'],
          duration: 1,
          failureMessages: [],
          fullName:
            'Order Suggestions getOrderSuggestions handles maximum limit of 10',
          status: 'passed',
          title: 'handles maximum limit of 10',
        },
        {
          ancestorTitles: ['Order Suggestions', 'getOrderSuggestions'],
          duration: 1,
          failureMessages: [
            'Error: expect(jest.fn()).toHaveBeenCalledWith(...expected)\n\nExpected: "items"\n\nNumber of calls: 0\n    at Object.toHaveBeenCalledWith (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/modassembly/supabase/database/suggestions.test.ts:152:42)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)',
          ],
          fullName:
            'Order Suggestions getOrderSuggestions uses correct query parameters',
          status: 'failed',
          title: 'uses correct query parameters',
        },
        {
          ancestorTitles: ['Order Suggestions', 'getOrderSuggestions'],
          duration: 1,
          failureMessages: [
            'Error: expect(jest.fn()).toHaveBeenCalledWith(...expected)\n\nExpected: "type", "food"\nReceived: called with 0 arguments\n\nNumber of calls: 1\n    at Object.toHaveBeenCalledWith (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/modassembly/supabase/database/suggestions.test.ts:162:52)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)',
          ],
          fullName:
            'Order Suggestions getOrderSuggestions defaults to food type when no type specified',
          status: 'failed',
          title: 'defaults to food type when no type specified',
        },
        {
          ancestorTitles: ['Order Suggestions', 'getOrderSuggestions'],
          duration: 0,
          failureMessages: [],
          fullName:
            'Order Suggestions getOrderSuggestions defaults to limit of 5 when no limit specified',
          status: 'passed',
          title: 'defaults to limit of 5 when no limit specified',
        },
        {
          ancestorTitles: ['Order Suggestions', 'getPopularItems'],
          duration: 1,
          failureMessages: [],
          fullName:
            'Order Suggestions getPopularItems returns empty array when no orders found',
          status: 'passed',
          title: 'returns empty array when no orders found',
        },
        {
          ancestorTitles: ['Order Suggestions', 'getPopularItems'],
          duration: 1,
          failureMessages: [],
          fullName:
            'Order Suggestions getPopularItems returns empty array when orders data is null',
          status: 'passed',
          title: 'returns empty array when orders data is null',
        },
        {
          ancestorTitles: ['Order Suggestions', 'getPopularItems'],
          duration: 0,
          failureMessages: [
            'Error: expect(received).toHaveLength(expected)\n\nExpected length: 6\nReceived length: 0\nReceived array:  []\n    at Object.toHaveLength (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/modassembly/supabase/database/suggestions.test.ts:226:22)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)',
          ],
          fullName:
            'Order Suggestions getPopularItems counts individual item frequency correctly',
          status: 'failed',
          title: 'counts individual item frequency correctly',
        },
        {
          ancestorTitles: ['Order Suggestions', 'getPopularItems'],
          duration: 1,
          failureMessages: [
            'Error: expect(received).toHaveLength(expected)\n\nExpected length: 3\nReceived length: 0\nReceived array:  []\n    at Object.toHaveLength (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/modassembly/supabase/database/suggestions.test.ts:235:22)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)',
          ],
          fullName:
            'Order Suggestions getPopularItems respects the limit parameter',
          status: 'failed',
          title: 'respects the limit parameter',
        },
        {
          ancestorTitles: ['Order Suggestions', 'getPopularItems'],
          duration: 2,
          failureMessages: [
            'Error: expect(received).toEqual(expected) // deep equality\n\n- Expected  - 5\n+ Received  + 1\n\n- Array [\n-   "chicken",\n-   "pasta",\n-   "valid-item",\n- ]\n+ Array []\n    at Object.toEqual (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/modassembly/supabase/database/suggestions.test.ts:252:22)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)',
          ],
          fullName:
            'Order Suggestions getPopularItems filters out invalid items',
          status: 'failed',
          title: 'filters out invalid items',
        },
        {
          ancestorTitles: ['Order Suggestions', 'getPopularItems'],
          duration: 1,
          failureMessages: [
            'Error: expect(jest.fn()).toHaveBeenCalledWith(...expected)\n\nExpected: "items"\n\nNumber of calls: 0\n    at Object.toHaveBeenCalledWith (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/modassembly/supabase/database/suggestions.test.ts:261:42)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)',
          ],
          fullName:
            'Order Suggestions getPopularItems uses correct query parameters',
          status: 'failed',
          title: 'uses correct query parameters',
        },
        {
          ancestorTitles: ['Order Suggestions', 'getPopularItems'],
          duration: 0,
          failureMessages: [
            'Error: expect(jest.fn()).toHaveBeenCalledWith(...expected)\n\nExpected: "type", "food"\n\nNumber of calls: 0\n    at Object.toHaveBeenCalledWith (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/modassembly/supabase/database/suggestions.test.ts:273:47)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)',
          ],
          fullName:
            'Order Suggestions getPopularItems defaults to food type when no type specified',
          status: 'failed',
          title: 'defaults to food type when no type specified',
        },
        {
          ancestorTitles: ['Order Suggestions', 'getPopularItems'],
          duration: 1,
          failureMessages: [],
          fullName:
            'Order Suggestions getPopularItems defaults to limit of 10 when no limit specified',
          status: 'passed',
          title: 'defaults to limit of 10 when no limit specified',
        },
        {
          ancestorTitles: ['Order Suggestions', 'getPopularItems'],
          duration: 0,
          failureMessages: [
            "TypeError: Cannot read properties of undefined (reading '1')\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/modassembly/supabase/database/suggestions.test.ts:293:29)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)",
          ],
          fullName:
            'Order Suggestions getPopularItems handles date filtering correctly',
          status: 'failed',
          title: 'handles date filtering correctly',
        },
        {
          ancestorTitles: ['Order Suggestions', 'Placeholder Functions'],
          duration: 0,
          failureMessages: [],
          fullName:
            'Order Suggestions Placeholder Functions getSeatResidentSuggestions returns empty array',
          status: 'passed',
          title: 'getSeatResidentSuggestions returns empty array',
        },
        {
          ancestorTitles: ['Order Suggestions', 'Placeholder Functions'],
          duration: 1,
          failureMessages: [],
          fullName:
            'Order Suggestions Placeholder Functions getTimeBasedResidentSuggestions returns empty array',
          status: 'passed',
          title: 'getTimeBasedResidentSuggestions returns empty array',
        },
      ],
    },
    {
      numFailingTests: 35,
      numPassingTests: 0,
      numPendingTests: 0,
      numTodoTests: 0,
      perfStats: {
        end: 1749868558322,
        runtime: 724,
        slow: false,
        start: 1749868557598,
      },
      testFilePath:
        '/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx',
      failureMessage:
        '  ● GrillStation › Rendering › renders with title and flame icon\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:23:26)\n\n  ● GrillStation › Rendering › applies custom className\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:30:48)\n\n  ● GrillStation › Rendering › shows empty state when no grill orders\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:43:26)\n\n  ● GrillStation › Order Filtering › filters orders containing grill items\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:60:26)\n\n  ● GrillStation › Order Filtering › recognizes all grill items\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:79:26)\n\n  ● GrillStation › Order Filtering › handles case-insensitive item matching\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:94:26)\n\n  ● GrillStation › Order Filtering › filters partial matches in item names\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:109:26)\n\n  ● GrillStation › Priority System › assigns high priority to grill items\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:128:48)\n\n  ● GrillStation › Priority System › assigns medium priority to non-core grill items\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:148:26)\n\n  ● GrillStation › Priority System › sorts orders by priority\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:171:26)\n\n  ● GrillStation › Priority System › sorts by elapsed time within same priority\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:197:26)\n\n  ● GrillStation › Time Estimation › displays estimated cooking times correctly\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:219:26)\n\n  ● GrillStation › Time Estimation › calculates max cook time for multiple items\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:237:26)\n\n  ● GrillStation › Time Estimation › highlights overdue orders\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:255:48)\n\n  ● GrillStation › Order Status and Actions › shows start button for new orders\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:276:26)\n\n  ● GrillStation › Order Status and Actions › shows done button for in-progress orders\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:293:26)\n\n  ● GrillStation › Order Status and Actions › calls onOrderAction when start button is clicked\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:311:43)\n\n  ● GrillStation › Order Status and Actions › calls onOrderAction when done button is clicked\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:332:43)\n\n  ● GrillStation › Order Details › displays order items with priority highlighting\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:353:48)\n\n  ● GrillStation › Order Details › displays special requests\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:375:26)\n\n  ● GrillStation › Order Details › displays table information\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:392:26)\n\n  ● GrillStation › Active Order Counter › counts active orders correctly\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:409:26)\n\n  ● GrillStation › Active Order Counter › shows green badge for low activity (≤2)\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:421:48)\n\n  ● GrillStation › Active Order Counter › shows yellow badge for medium activity (3-5)\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:438:48)\n\n  ● GrillStation › Active Order Counter › shows red badge for high activity (>5)\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:455:48)\n\n  ● GrillStation › Performance › handles large number of orders efficiently\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:475:26)\n\n  ● GrillStation › Performance › memoizes order cards to prevent unnecessary re-renders\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:489:47)\n\n  ● GrillStation › Edge Cases › handles orders with no items\n\n    expect(received).not.toThrow()\n\n    Error name:    "TypeError"\n    Error message: "Cannot redefine property: clipboard"\n\n          102 |   )\n          103 |\n        > 104 |   const userEventInstance = userEvent.setup()\n              |                                       ^\n          105 |\n          106 |   return {\n          107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at __tests__/unit/components/kds/stations/grill-station.test.tsx:512:28\n      at Object.<anonymous> (node_modules/expect/build/toThrowMatchers.js:74:11)\n      at Object.throwingMatcher [as toThrow] (node_modules/expect/build/index.js:320:21)\n      at Object.toThrow (__tests__/unit/components/kds/stations/grill-station.test.tsx:515:14)\n      at Object.toThrow (__tests__/unit/components/kds/stations/grill-station.test.tsx:515:14)\n\n  ● GrillStation › Edge Cases › handles orders with null/undefined items\n\n    expect(received).not.toThrow()\n\n    Error name:    "TypeError"\n    Error message: "Cannot redefine property: clipboard"\n\n          102 |   )\n          103 |\n        > 104 |   const userEventInstance = userEvent.setup()\n              |                                       ^\n          105 |\n          106 |   return {\n          107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at __tests__/unit/components/kds/stations/grill-station.test.tsx:530:28\n      at Object.<anonymous> (node_modules/expect/build/toThrowMatchers.js:74:11)\n      at Object.throwingMatcher [as toThrow] (node_modules/expect/build/index.js:320:21)\n      at Object.toThrow (__tests__/unit/components/kds/stations/grill-station.test.tsx:533:14)\n      at Object.toThrow (__tests__/unit/components/kds/stations/grill-station.test.tsx:533:14)\n\n  ● GrillStation › Edge Cases › handles missing elapsed_seconds\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:547:26)\n\n  ● GrillStation › Edge Cases › handles missing table_label\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:562:26)\n\n  ● GrillStation › Accessibility › has proper ARIA labels and structure\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:580:26)\n\n  ● GrillStation › Accessibility › supports keyboard navigation\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:601:43)\n\n  ● GrillStation › Accessibility › has semantic color coding for status\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:618:48)\n\n  ● GrillStation › Station Integration › integrates properly with KDS action system\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/stations/grill-station.test.tsx:640:43)\n',
      testResults: [
        {
          ancestorTitles: ['GrillStation', 'Rendering'],
          duration: 17,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:23:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName: 'GrillStation Rendering renders with title and flame icon',
          status: 'failed',
          title: 'renders with title and flame icon',
        },
        {
          ancestorTitles: ['GrillStation', 'Rendering'],
          duration: 2,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:30:48)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName: 'GrillStation Rendering applies custom className',
          status: 'failed',
          title: 'applies custom className',
        },
        {
          ancestorTitles: ['GrillStation', 'Rendering'],
          duration: 2,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:43:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'GrillStation Rendering shows empty state when no grill orders',
          status: 'failed',
          title: 'shows empty state when no grill orders',
        },
        {
          ancestorTitles: ['GrillStation', 'Order Filtering'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:60:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'GrillStation Order Filtering filters orders containing grill items',
          status: 'failed',
          title: 'filters orders containing grill items',
        },
        {
          ancestorTitles: ['GrillStation', 'Order Filtering'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:79:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName: 'GrillStation Order Filtering recognizes all grill items',
          status: 'failed',
          title: 'recognizes all grill items',
        },
        {
          ancestorTitles: ['GrillStation', 'Order Filtering'],
          duration: 1,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:94:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'GrillStation Order Filtering handles case-insensitive item matching',
          status: 'failed',
          title: 'handles case-insensitive item matching',
        },
        {
          ancestorTitles: ['GrillStation', 'Order Filtering'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:109:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'GrillStation Order Filtering filters partial matches in item names',
          status: 'failed',
          title: 'filters partial matches in item names',
        },
        {
          ancestorTitles: ['GrillStation', 'Priority System'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:128:48)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'GrillStation Priority System assigns high priority to grill items',
          status: 'failed',
          title: 'assigns high priority to grill items',
        },
        {
          ancestorTitles: ['GrillStation', 'Priority System'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:148:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'GrillStation Priority System assigns medium priority to non-core grill items',
          status: 'failed',
          title: 'assigns medium priority to non-core grill items',
        },
        {
          ancestorTitles: ['GrillStation', 'Priority System'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:171:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName: 'GrillStation Priority System sorts orders by priority',
          status: 'failed',
          title: 'sorts orders by priority',
        },
        {
          ancestorTitles: ['GrillStation', 'Priority System'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:197:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'GrillStation Priority System sorts by elapsed time within same priority',
          status: 'failed',
          title: 'sorts by elapsed time within same priority',
        },
        {
          ancestorTitles: ['GrillStation', 'Time Estimation'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:219:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'GrillStation Time Estimation displays estimated cooking times correctly',
          status: 'failed',
          title: 'displays estimated cooking times correctly',
        },
        {
          ancestorTitles: ['GrillStation', 'Time Estimation'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:237:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'GrillStation Time Estimation calculates max cook time for multiple items',
          status: 'failed',
          title: 'calculates max cook time for multiple items',
        },
        {
          ancestorTitles: ['GrillStation', 'Time Estimation'],
          duration: 1,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:255:48)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName: 'GrillStation Time Estimation highlights overdue orders',
          status: 'failed',
          title: 'highlights overdue orders',
        },
        {
          ancestorTitles: ['GrillStation', 'Order Status and Actions'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:276:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'GrillStation Order Status and Actions shows start button for new orders',
          status: 'failed',
          title: 'shows start button for new orders',
        },
        {
          ancestorTitles: ['GrillStation', 'Order Status and Actions'],
          duration: 1,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:293:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'GrillStation Order Status and Actions shows done button for in-progress orders',
          status: 'failed',
          title: 'shows done button for in-progress orders',
        },
        {
          ancestorTitles: ['GrillStation', 'Order Status and Actions'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:311:43)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'GrillStation Order Status and Actions calls onOrderAction when start button is clicked',
          status: 'failed',
          title: 'calls onOrderAction when start button is clicked',
        },
        {
          ancestorTitles: ['GrillStation', 'Order Status and Actions'],
          duration: 1,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:332:43)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'GrillStation Order Status and Actions calls onOrderAction when done button is clicked',
          status: 'failed',
          title: 'calls onOrderAction when done button is clicked',
        },
        {
          ancestorTitles: ['GrillStation', 'Order Details'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:353:48)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'GrillStation Order Details displays order items with priority highlighting',
          status: 'failed',
          title: 'displays order items with priority highlighting',
        },
        {
          ancestorTitles: ['GrillStation', 'Order Details'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:375:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName: 'GrillStation Order Details displays special requests',
          status: 'failed',
          title: 'displays special requests',
        },
        {
          ancestorTitles: ['GrillStation', 'Order Details'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:392:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName: 'GrillStation Order Details displays table information',
          status: 'failed',
          title: 'displays table information',
        },
        {
          ancestorTitles: ['GrillStation', 'Active Order Counter'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:409:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'GrillStation Active Order Counter counts active orders correctly',
          status: 'failed',
          title: 'counts active orders correctly',
        },
        {
          ancestorTitles: ['GrillStation', 'Active Order Counter'],
          duration: 1,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:421:48)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'GrillStation Active Order Counter shows green badge for low activity (≤2)',
          status: 'failed',
          title: 'shows green badge for low activity (≤2)',
        },
        {
          ancestorTitles: ['GrillStation', 'Active Order Counter'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:438:48)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'GrillStation Active Order Counter shows yellow badge for medium activity (3-5)',
          status: 'failed',
          title: 'shows yellow badge for medium activity (3-5)',
        },
        {
          ancestorTitles: ['GrillStation', 'Active Order Counter'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:455:48)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'GrillStation Active Order Counter shows red badge for high activity (>5)',
          status: 'failed',
          title: 'shows red badge for high activity (>5)',
        },
        {
          ancestorTitles: ['GrillStation', 'Performance'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:475:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'GrillStation Performance handles large number of orders efficiently',
          status: 'failed',
          title: 'handles large number of orders efficiently',
        },
        {
          ancestorTitles: ['GrillStation', 'Performance'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:489:47)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'GrillStation Performance memoizes order cards to prevent unnecessary re-renders',
          status: 'failed',
          title: 'memoizes order cards to prevent unnecessary re-renders',
        },
        {
          ancestorTitles: ['GrillStation', 'Edge Cases'],
          duration: 14,
          failureMessages: [
            'Error: expect(received).not.toThrow()\n\nError name:    "TypeError"\nError message: "Cannot redefine property: clipboard"\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at __tests__/unit/components/kds/stations/grill-station.test.tsx:512:28\n      at Object.<anonymous> (node_modules/expect/build/toThrowMatchers.js:74:11)\n      at Object.throwingMatcher [as toThrow] (node_modules/expect/build/index.js:320:21)\n      at Object.toThrow (__tests__/unit/components/kds/stations/grill-station.test.tsx:515:14)\n    at Object.toThrow (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:515:14)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName: 'GrillStation Edge Cases handles orders with no items',
          status: 'failed',
          title: 'handles orders with no items',
        },
        {
          ancestorTitles: ['GrillStation', 'Edge Cases'],
          duration: 2,
          failureMessages: [
            'Error: expect(received).not.toThrow()\n\nError name:    "TypeError"\nError message: "Cannot redefine property: clipboard"\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at __tests__/unit/components/kds/stations/grill-station.test.tsx:530:28\n      at Object.<anonymous> (node_modules/expect/build/toThrowMatchers.js:74:11)\n      at Object.throwingMatcher [as toThrow] (node_modules/expect/build/index.js:320:21)\n      at Object.toThrow (__tests__/unit/components/kds/stations/grill-station.test.tsx:533:14)\n    at Object.toThrow (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:533:14)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'GrillStation Edge Cases handles orders with null/undefined items',
          status: 'failed',
          title: 'handles orders with null/undefined items',
        },
        {
          ancestorTitles: ['GrillStation', 'Edge Cases'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:547:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName: 'GrillStation Edge Cases handles missing elapsed_seconds',
          status: 'failed',
          title: 'handles missing elapsed_seconds',
        },
        {
          ancestorTitles: ['GrillStation', 'Edge Cases'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:562:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName: 'GrillStation Edge Cases handles missing table_label',
          status: 'failed',
          title: 'handles missing table_label',
        },
        {
          ancestorTitles: ['GrillStation', 'Accessibility'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:580:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'GrillStation Accessibility has proper ARIA labels and structure',
          status: 'failed',
          title: 'has proper ARIA labels and structure',
        },
        {
          ancestorTitles: ['GrillStation', 'Accessibility'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:601:43)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName: 'GrillStation Accessibility supports keyboard navigation',
          status: 'failed',
          title: 'supports keyboard navigation',
        },
        {
          ancestorTitles: ['GrillStation', 'Accessibility'],
          duration: 1,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:618:48)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'GrillStation Accessibility has semantic color coding for status',
          status: 'failed',
          title: 'has semantic color coding for status',
        },
        {
          ancestorTitles: ['GrillStation', 'Station Integration'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/stations/grill-station.test.tsx:640:43)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'GrillStation Station Integration integrates properly with KDS action system',
          status: 'failed',
          title: 'integrates properly with KDS action system',
        },
      ],
    },
    {
      numFailingTests: 7,
      numPassingTests: 14,
      numPendingTests: 0,
      numTodoTests: 0,
      perfStats: {
        end: 1749868558368,
        runtime: 779,
        slow: false,
        start: 1749868557589,
      },
      testFilePath:
        '/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/voice-ordering/audio-optimization.test.ts',
      failureMessage:
        "  ● AudioOptimizer › Audio Analysis › should analyze audio file properties correctly\n\n    expect(received).toBe(expected) // Object.is equality\n\n    Expected: 1048576\n    Received: 1\n\n      70 |       const analysis = await optimizer.analyzeAudio(blob)\n      71 |\n    > 72 |       expect(analysis.size).toBe(1024 * 1024)\n         |                             ^\n      73 |       expect(analysis.format).toBe('wav')\n      74 |       expect(analysis.duration).toBeGreaterThan(0)\n      75 |       expect(analysis.estimatedCost).toBeGreaterThan(0)\n\n      at Object.toBe (__tests__/unit/lib/voice-ordering/audio-optimization.test.ts:72:29)\n\n  ● AudioOptimizer › Optimization Detection › should identify files that need optimization\n\n    expect(received).toBe(expected) // Object.is equality\n\n    Expected: true\n    Received: false\n\n      116 |       const formatAnalysis = await optimizer.analyzeAudio(wrongFormat)\n      117 |\n    > 118 |       expect(largeAnalysis.needsOptimization).toBe(true)\n          |                                               ^\n      119 |       expect(formatAnalysis.needsOptimization).toBe(true)\n      120 |     })\n      121 |\n\n      at Object.toBe (__tests__/unit/lib/voice-ordering/audio-optimization.test.ts:118:47)\n\n  ● AudioOptimizer › Audio Optimization › should compress large audio files\n\n    expect(received).toBeGreaterThan(expected)\n\n    Expected: > 1\n    Received:   1\n\n      135 |       const result = await optimizer.optimizeAudio(blob)\n      136 |\n    > 137 |       expect(result.compressionRatio).toBeGreaterThan(1)\n          |                                       ^\n      138 |       expect(result.optimizedBlob.size).toBeLessThanOrEqual(result.originalBlob.size)\n      139 |       expect(result.costSavings).toBeGreaterThanOrEqual(0)\n      140 |       expect(result.optimizationApplied.length).toBeGreaterThan(0)\n\n      at Object.toBeGreaterThan (__tests__/unit/lib/voice-ordering/audio-optimization.test.ts:137:39)\n\n  ● AudioOptimizer › Audio Optimization › should apply multiple optimizations when needed\n\n    expect(received).toBeGreaterThan(expected)\n\n    Expected: > 1\n    Received:   1\n\n      159 |\n      160 |       // Should apply format conversion and compression\n    > 161 |       expect(result.optimizationApplied.length).toBeGreaterThan(1)\n          |                                                 ^\n      162 |       expect(result.optimizationApplied).toContain('format-conversion')\n      163 |       expect(result.compressionRatio).toBeGreaterThan(1)\n      164 |     })\n\n      at Object.toBeGreaterThan (__tests__/unit/lib/voice-ordering/audio-optimization.test.ts:161:49)\n\n  ● AudioOptimizer › Audio Optimization › should handle optimization failures gracefully\n\n    expect(received).toContain(expected) // indexOf\n\n    Expected value: \"optimization-failed\"\n    Received array: [\"no-optimization-needed\"]\n\n      173 |       // Should fallback to original blob when optimization fails\n      174 |       expect(result.optimizedBlob).toBe(result.originalBlob)\n    > 175 |       expect(result.optimizationApplied).toContain('optimization-failed')\n          |                                          ^\n      176 |     })\n      177 |   })\n      178 |\n\n      at Object.toContain (__tests__/unit/lib/voice-ordering/audio-optimization.test.ts:175:42)\n\n  ● AudioOptimizer › Cost Optimization › should maintain transcription quality while reducing costs\n\n    expect(received).toBeGreaterThan(expected)\n\n    Expected: > 1\n    Received:   1\n\n      223 |\n      224 |       // Optimization should balance cost savings with quality\n    > 225 |       expect(result.compressionRatio).toBeGreaterThan(1)\n          |                                       ^\n      226 |       expect(result.compressionRatio).toBeLessThan(10) // Don't over-compress\n      227 |     })\n      228 |   })\n\n      at Object.toBeGreaterThan (__tests__/unit/lib/voice-ordering/audio-optimization.test.ts:225:39)\n\n  ● AudioOptimizer › Edge Cases › should handle unsupported formats gracefully\n\n    expect(received).toBe(expected) // Object.is equality\n\n    Expected: \"unknown\"\n    Received: \"mp3\"\n\n      284 |\n      285 |       // Should still provide some result\n    > 286 |       expect(result.analysis.format).toBe('unknown')\n          |                                      ^\n      287 |       expect(result.optimizedBlob).toBeDefined()\n      288 |     })\n      289 |\n\n      at Object.toBe (__tests__/unit/lib/voice-ordering/audio-optimization.test.ts:286:38)\n",
      testResults: [
        {
          ancestorTitles: ['AudioOptimizer', 'Audio Analysis'],
          duration: 25,
          failureMessages: [
            'Error: expect(received).toBe(expected) // Object.is equality\n\nExpected: 1048576\nReceived: 1\n    at Object.toBe (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/voice-ordering/audio-optimization.test.ts:72:29)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)',
          ],
          fullName:
            'AudioOptimizer Audio Analysis should analyze audio file properties correctly',
          status: 'failed',
          title: 'should analyze audio file properties correctly',
        },
        {
          ancestorTitles: ['AudioOptimizer', 'Audio Analysis'],
          duration: 3,
          failureMessages: [],
          fullName:
            'AudioOptimizer Audio Analysis should detect different audio formats',
          status: 'passed',
          title: 'should detect different audio formats',
        },
        {
          ancestorTitles: ['AudioOptimizer', 'Audio Analysis'],
          duration: 4,
          failureMessages: [],
          fullName:
            'AudioOptimizer Audio Analysis should calculate estimated transcription cost',
          status: 'passed',
          title: 'should calculate estimated transcription cost',
        },
        {
          ancestorTitles: ['AudioOptimizer', 'Optimization Detection'],
          duration: 25,
          failureMessages: [
            'Error: expect(received).toBe(expected) // Object.is equality\n\nExpected: true\nReceived: false\n    at Object.toBe (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/voice-ordering/audio-optimization.test.ts:118:47)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)',
          ],
          fullName:
            'AudioOptimizer Optimization Detection should identify files that need optimization',
          status: 'failed',
          title: 'should identify files that need optimization',
        },
        {
          ancestorTitles: ['AudioOptimizer', 'Optimization Detection'],
          duration: 2,
          failureMessages: [],
          fullName:
            'AudioOptimizer Optimization Detection should not optimize files that are already optimal',
          status: 'passed',
          title: 'should not optimize files that are already optimal',
        },
        {
          ancestorTitles: ['AudioOptimizer', 'Audio Optimization'],
          duration: 11,
          failureMessages: [
            'Error: expect(received).toBeGreaterThan(expected)\n\nExpected: > 1\nReceived:   1\n    at Object.toBeGreaterThan (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/voice-ordering/audio-optimization.test.ts:137:39)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)',
          ],
          fullName:
            'AudioOptimizer Audio Optimization should compress large audio files',
          status: 'failed',
          title: 'should compress large audio files',
        },
        {
          ancestorTitles: ['AudioOptimizer', 'Audio Optimization'],
          duration: 1,
          failureMessages: [],
          fullName:
            'AudioOptimizer Audio Optimization should skip optimization for already optimal files',
          status: 'passed',
          title: 'should skip optimization for already optimal files',
        },
        {
          ancestorTitles: ['AudioOptimizer', 'Audio Optimization'],
          duration: 31,
          failureMessages: [
            'Error: expect(received).toBeGreaterThan(expected)\n\nExpected: > 1\nReceived:   1\n    at Object.toBeGreaterThan (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/voice-ordering/audio-optimization.test.ts:161:49)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)',
          ],
          fullName:
            'AudioOptimizer Audio Optimization should apply multiple optimizations when needed',
          status: 'failed',
          title: 'should apply multiple optimizations when needed',
        },
        {
          ancestorTitles: ['AudioOptimizer', 'Audio Optimization'],
          duration: 12,
          failureMessages: [
            'Error: expect(received).toContain(expected) // indexOf\n\nExpected value: "optimization-failed"\nReceived array: ["no-optimization-needed"]\n    at Object.toContain (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/voice-ordering/audio-optimization.test.ts:175:42)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)',
          ],
          fullName:
            'AudioOptimizer Audio Optimization should handle optimization failures gracefully',
          status: 'failed',
          title: 'should handle optimization failures gracefully',
        },
        {
          ancestorTitles: ['AudioOptimizer', 'Compression Effectiveness'],
          duration: 55,
          failureMessages: [],
          fullName:
            'AudioOptimizer Compression Effectiveness should achieve target compression ratios',
          status: 'passed',
          title: 'should achieve target compression ratios',
        },
        {
          ancestorTitles: ['AudioOptimizer', 'Compression Effectiveness'],
          duration: 13,
          failureMessages: [],
          fullName:
            'AudioOptimizer Compression Effectiveness should reduce file sizes by at least 30% for large files',
          status: 'passed',
          title: 'should reduce file sizes by at least 30% for large files',
        },
        {
          ancestorTitles: ['AudioOptimizer', 'Cost Optimization'],
          duration: 12,
          failureMessages: [],
          fullName:
            'AudioOptimizer Cost Optimization should calculate cost savings from optimization',
          status: 'passed',
          title: 'should calculate cost savings from optimization',
        },
        {
          ancestorTitles: ['AudioOptimizer', 'Cost Optimization'],
          duration: 11,
          failureMessages: [
            'Error: expect(received).toBeGreaterThan(expected)\n\nExpected: > 1\nReceived:   1\n    at Object.toBeGreaterThan (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/voice-ordering/audio-optimization.test.ts:225:39)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)',
          ],
          fullName:
            'AudioOptimizer Cost Optimization should maintain transcription quality while reducing costs',
          status: 'failed',
          title: 'should maintain transcription quality while reducing costs',
        },
        {
          ancestorTitles: ['AudioOptimizer', 'Format Optimization'],
          duration: 2,
          failureMessages: [],
          fullName:
            'AudioOptimizer Format Optimization should convert to optimal formats',
          status: 'passed',
          title: 'should convert to optimal formats',
        },
        {
          ancestorTitles: ['AudioOptimizer', 'Performance Requirements'],
          duration: 4,
          failureMessages: [],
          fullName:
            'AudioOptimizer Performance Requirements should optimize audio files quickly',
          status: 'passed',
          title: 'should optimize audio files quickly',
        },
        {
          ancestorTitles: ['AudioOptimizer', 'Performance Requirements'],
          duration: 19,
          failureMessages: [],
          fullName:
            'AudioOptimizer Performance Requirements should handle multiple file sizes efficiently',
          status: 'passed',
          title: 'should handle multiple file sizes efficiently',
        },
        {
          ancestorTitles: ['AudioOptimizer', 'Edge Cases'],
          duration: 0,
          failureMessages: [],
          fullName:
            'AudioOptimizer Edge Cases should handle very small audio files',
          status: 'passed',
          title: 'should handle very small audio files',
        },
        {
          ancestorTitles: ['AudioOptimizer', 'Edge Cases'],
          duration: 1,
          failureMessages: [
            'Error: expect(received).toBe(expected) // Object.is equality\n\nExpected: "unknown"\nReceived: "mp3"\n    at Object.toBe (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/voice-ordering/audio-optimization.test.ts:286:38)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)',
          ],
          fullName:
            'AudioOptimizer Edge Cases should handle unsupported formats gracefully',
          status: 'failed',
          title: 'should handle unsupported formats gracefully',
        },
        {
          ancestorTitles: ['AudioOptimizer', 'Edge Cases'],
          duration: 1,
          failureMessages: [],
          fullName:
            'AudioOptimizer Edge Cases should handle corrupted audio data',
          status: 'passed',
          title: 'should handle corrupted audio data',
        },
        {
          ancestorTitles: [
            'AudioOptimizer',
            'Integration with Transcription Pipeline',
          ],
          duration: 18,
          failureMessages: [],
          fullName:
            'AudioOptimizer Integration with Transcription Pipeline should integrate with the convenience function',
          status: 'passed',
          title: 'should integrate with the convenience function',
        },
        {
          ancestorTitles: [
            'AudioOptimizer',
            'Integration with Transcription Pipeline',
          ],
          duration: 6,
          failureMessages: [],
          fullName:
            'AudioOptimizer Integration with Transcription Pipeline should provide detailed metadata for tracking',
          status: 'passed',
          title: 'should provide detailed metadata for tracking',
        },
      ],
    },
    {
      numFailingTests: 0,
      numPassingTests: 2,
      numPendingTests: 0,
      numTodoTests: 0,
      perfStats: {
        end: 1749868558382,
        runtime: 64,
        slow: false,
        start: 1749868558318,
      },
      testFilePath:
        '/Users/mike/Plate-Restaurant-System-App/__tests__/unit/basic.test.ts',
      failureMessage: null,
      testResults: [
        {
          ancestorTitles: ['Unit Tests - Basic'],
          duration: 2,
          failureMessages: [],
          fullName: 'Unit Tests - Basic utility functions work correctly',
          status: 'passed',
          title: 'utility functions work correctly',
        },
        {
          ancestorTitles: ['Unit Tests - Basic'],
          duration: 0,
          failureMessages: [],
          fullName: 'Unit Tests - Basic React components can be tested',
          status: 'passed',
          title: 'React components can be tested',
        },
      ],
    },
    {
      numFailingTests: 31,
      numPassingTests: 0,
      numPendingTests: 0,
      numTodoTests: 0,
      perfStats: {
        end: 1749868558396,
        runtime: 279,
        slow: false,
        start: 1749868558117,
      },
      testFilePath:
        '/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx',
      failureMessage:
        '  ● KDSMainContent › Rendering States › renders loading skeleton when loading\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:89:26)\n\n  ● KDSMainContent › Rendering States › renders error display when there is an error\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:98:26)\n\n  ● KDSMainContent › Rendering States › renders empty state when no orders\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:108:26)\n\n  ● KDSMainContent › Rendering States › renders empty state with filter-specific message\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:119:26)\n\n  ● KDSMainContent › View Modes › renders individual orders in grid view\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:138:26)\n\n  ● KDSMainContent › View Modes › renders individual orders in list view\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:147:26)\n\n  ● KDSMainContent › View Modes › renders table groups in table view\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:156:26)\n\n  ● KDSMainContent › View Modes › applies correct grid classes for different view modes\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:163:48)\n\n  ● KDSMainContent › View Modes › adapts grid layout based on order count\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:173:58)\n\n  ● KDSMainContent › Data Filtering and Sorting › filters orders by status\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:221:26)\n\n  ● KDSMainContent › Data Filtering and Sorting › sorts orders by priority\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:239:26)\n\n  ● KDSMainContent › Data Filtering and Sorting › sorts orders by time\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:270:26)\n\n  ● KDSMainContent › Data Filtering and Sorting › sorts orders by table\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:300:26)\n\n  ● KDSMainContent › User Interactions › handles order bump action\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:317:43)\n\n  ● KDSMainContent › User Interactions › handles order recall action\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:330:43)\n\n  ● KDSMainContent › User Interactions › handles table bump action in table view\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:344:43)\n\n  ● KDSMainContent › Performance › memoizes components to prevent unnecessary re-renders\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:362:47)\n\n  ● KDSMainContent › Performance › handles large datasets efficiently\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:379:26)\n\n  ● KDSMainContent › Performance › optimizes scroll area rendering\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:390:48)\n\n  ● KDSMainContent › Edge Cases › handles null or undefined orders gracefully\n\n    expect(received).not.toThrow()\n\n    Error name:    "TypeError"\n    Error message: "Cannot redefine property: clipboard"\n\n          102 |   )\n          103 |\n        > 104 |   const userEventInstance = userEvent.setup()\n              |                                       ^\n          105 |\n          106 |   return {\n          107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at __tests__/unit/components/kds/kds-main-content.test.tsx:402:28\n      at Object.<anonymous> (node_modules/expect/build/toThrowMatchers.js:74:11)\n      at Object.throwingMatcher [as toThrow] (node_modules/expect/build/index.js:320:21)\n      at Object.toThrow (__tests__/unit/components/kds/kds-main-content.test.tsx:403:14)\n      at Object.toThrow (__tests__/unit/components/kds/kds-main-content.test.tsx:403:14)\n\n  ● KDSMainContent › Edge Cases › handles orders with missing data\n\n    expect(received).not.toThrow()\n\n    Error name:    "TypeError"\n    Error message: "Cannot redefine property: clipboard"\n\n          102 |   )\n          103 |\n        > 104 |   const userEventInstance = userEvent.setup()\n              |                                       ^\n          105 |\n          106 |   return {\n          107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at __tests__/unit/components/kds/kds-main-content.test.tsx:417:28\n      at Object.<anonymous> (node_modules/expect/build/toThrowMatchers.js:74:11)\n      at Object.throwingMatcher [as toThrow] (node_modules/expect/build/index.js:320:21)\n      at Object.toThrow (__tests__/unit/components/kds/kds-main-content.test.tsx:418:14)\n      at Object.toThrow (__tests__/unit/components/kds/kds-main-content.test.tsx:418:14)\n\n  ● KDSMainContent › Edge Cases › handles invalid dates in sorting\n\n    expect(received).not.toThrow()\n\n    Error name:    "TypeError"\n    Error message: "Cannot redefine property: clipboard"\n\n          102 |   )\n          103 |\n        > 104 |   const userEventInstance = userEvent.setup()\n              |                                       ^\n          105 |\n          106 |   return {\n          107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at __tests__/unit/components/kds/kds-main-content.test.tsx:437:28\n      at Object.<anonymous> (node_modules/expect/build/toThrowMatchers.js:74:11)\n      at Object.throwingMatcher [as toThrow] (node_modules/expect/build/index.js:320:21)\n      at Object.toThrow (__tests__/unit/components/kds/kds-main-content.test.tsx:438:14)\n      at Object.toThrow (__tests__/unit/components/kds/kds-main-content.test.tsx:438:14)\n\n  ● KDSMainContent › Edge Cases › handles empty table groups in table view\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:451:26)\n\n  ● KDSMainContent › Accessibility › has proper ARIA structure\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:461:26)\n\n  ● KDSMainContent › Accessibility › supports keyboard navigation\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:473:43)\n\n  ● KDSMainContent › Accessibility › maintains focus management in different view modes\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:482:53)\n\n  ● KDSMainContent › Error Recovery › recovers from error state when data loads successfully\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:500:47)\n\n  ● KDSMainContent › Error Recovery › clears error when switching between states\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:515:47)\n\n  ● KDSMainContent › Styling and Layout › applies custom className\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:531:48)\n\n  ● KDSMainContent › Styling and Layout › maintains responsive grid layout\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:539:48)\n\n  ● KDSMainContent › Styling and Layout › applies proper spacing and padding\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-main-content.test.tsx:546:48)\n',
      testResults: [
        {
          ancestorTitles: ['KDSMainContent', 'Rendering States'],
          duration: 2,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:89:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent Rendering States renders loading skeleton when loading',
          status: 'failed',
          title: 'renders loading skeleton when loading',
        },
        {
          ancestorTitles: ['KDSMainContent', 'Rendering States'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:98:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent Rendering States renders error display when there is an error',
          status: 'failed',
          title: 'renders error display when there is an error',
        },
        {
          ancestorTitles: ['KDSMainContent', 'Rendering States'],
          duration: 1,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:108:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent Rendering States renders empty state when no orders',
          status: 'failed',
          title: 'renders empty state when no orders',
        },
        {
          ancestorTitles: ['KDSMainContent', 'Rendering States'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:119:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent Rendering States renders empty state with filter-specific message',
          status: 'failed',
          title: 'renders empty state with filter-specific message',
        },
        {
          ancestorTitles: ['KDSMainContent', 'View Modes'],
          duration: 1,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:138:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent View Modes renders individual orders in grid view',
          status: 'failed',
          title: 'renders individual orders in grid view',
        },
        {
          ancestorTitles: ['KDSMainContent', 'View Modes'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:147:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent View Modes renders individual orders in list view',
          status: 'failed',
          title: 'renders individual orders in list view',
        },
        {
          ancestorTitles: ['KDSMainContent', 'View Modes'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:156:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent View Modes renders table groups in table view',
          status: 'failed',
          title: 'renders table groups in table view',
        },
        {
          ancestorTitles: ['KDSMainContent', 'View Modes'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:163:48)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent View Modes applies correct grid classes for different view modes',
          status: 'failed',
          title: 'applies correct grid classes for different view modes',
        },
        {
          ancestorTitles: ['KDSMainContent', 'View Modes'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:173:58)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent View Modes adapts grid layout based on order count',
          status: 'failed',
          title: 'adapts grid layout based on order count',
        },
        {
          ancestorTitles: ['KDSMainContent', 'Data Filtering and Sorting'],
          duration: 1,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:221:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent Data Filtering and Sorting filters orders by status',
          status: 'failed',
          title: 'filters orders by status',
        },
        {
          ancestorTitles: ['KDSMainContent', 'Data Filtering and Sorting'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:239:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent Data Filtering and Sorting sorts orders by priority',
          status: 'failed',
          title: 'sorts orders by priority',
        },
        {
          ancestorTitles: ['KDSMainContent', 'Data Filtering and Sorting'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:270:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent Data Filtering and Sorting sorts orders by time',
          status: 'failed',
          title: 'sorts orders by time',
        },
        {
          ancestorTitles: ['KDSMainContent', 'Data Filtering and Sorting'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:300:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent Data Filtering and Sorting sorts orders by table',
          status: 'failed',
          title: 'sorts orders by table',
        },
        {
          ancestorTitles: ['KDSMainContent', 'User Interactions'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:317:43)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent User Interactions handles order bump action',
          status: 'failed',
          title: 'handles order bump action',
        },
        {
          ancestorTitles: ['KDSMainContent', 'User Interactions'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:330:43)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent User Interactions handles order recall action',
          status: 'failed',
          title: 'handles order recall action',
        },
        {
          ancestorTitles: ['KDSMainContent', 'User Interactions'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:344:43)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent User Interactions handles table bump action in table view',
          status: 'failed',
          title: 'handles table bump action in table view',
        },
        {
          ancestorTitles: ['KDSMainContent', 'Performance'],
          duration: 1,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:362:47)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent Performance memoizes components to prevent unnecessary re-renders',
          status: 'failed',
          title: 'memoizes components to prevent unnecessary re-renders',
        },
        {
          ancestorTitles: ['KDSMainContent', 'Performance'],
          duration: 1,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:379:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent Performance handles large datasets efficiently',
          status: 'failed',
          title: 'handles large datasets efficiently',
        },
        {
          ancestorTitles: ['KDSMainContent', 'Performance'],
          duration: 1,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:390:48)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent Performance optimizes scroll area rendering',
          status: 'failed',
          title: 'optimizes scroll area rendering',
        },
        {
          ancestorTitles: ['KDSMainContent', 'Edge Cases'],
          duration: 4,
          failureMessages: [
            'Error: expect(received).not.toThrow()\n\nError name:    "TypeError"\nError message: "Cannot redefine property: clipboard"\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at __tests__/unit/components/kds/kds-main-content.test.tsx:402:28\n      at Object.<anonymous> (node_modules/expect/build/toThrowMatchers.js:74:11)\n      at Object.throwingMatcher [as toThrow] (node_modules/expect/build/index.js:320:21)\n      at Object.toThrow (__tests__/unit/components/kds/kds-main-content.test.tsx:403:14)\n    at Object.toThrow (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:403:14)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent Edge Cases handles null or undefined orders gracefully',
          status: 'failed',
          title: 'handles null or undefined orders gracefully',
        },
        {
          ancestorTitles: ['KDSMainContent', 'Edge Cases'],
          duration: 1,
          failureMessages: [
            'Error: expect(received).not.toThrow()\n\nError name:    "TypeError"\nError message: "Cannot redefine property: clipboard"\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at __tests__/unit/components/kds/kds-main-content.test.tsx:417:28\n      at Object.<anonymous> (node_modules/expect/build/toThrowMatchers.js:74:11)\n      at Object.throwingMatcher [as toThrow] (node_modules/expect/build/index.js:320:21)\n      at Object.toThrow (__tests__/unit/components/kds/kds-main-content.test.tsx:418:14)\n    at Object.toThrow (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:418:14)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent Edge Cases handles orders with missing data',
          status: 'failed',
          title: 'handles orders with missing data',
        },
        {
          ancestorTitles: ['KDSMainContent', 'Edge Cases'],
          duration: 13,
          failureMessages: [
            'Error: expect(received).not.toThrow()\n\nError name:    "TypeError"\nError message: "Cannot redefine property: clipboard"\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at __tests__/unit/components/kds/kds-main-content.test.tsx:437:28\n      at Object.<anonymous> (node_modules/expect/build/toThrowMatchers.js:74:11)\n      at Object.throwingMatcher [as toThrow] (node_modules/expect/build/index.js:320:21)\n      at Object.toThrow (__tests__/unit/components/kds/kds-main-content.test.tsx:438:14)\n    at Object.toThrow (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:438:14)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent Edge Cases handles invalid dates in sorting',
          status: 'failed',
          title: 'handles invalid dates in sorting',
        },
        {
          ancestorTitles: ['KDSMainContent', 'Edge Cases'],
          duration: 1,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:451:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent Edge Cases handles empty table groups in table view',
          status: 'failed',
          title: 'handles empty table groups in table view',
        },
        {
          ancestorTitles: ['KDSMainContent', 'Accessibility'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:461:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName: 'KDSMainContent Accessibility has proper ARIA structure',
          status: 'failed',
          title: 'has proper ARIA structure',
        },
        {
          ancestorTitles: ['KDSMainContent', 'Accessibility'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:473:43)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName: 'KDSMainContent Accessibility supports keyboard navigation',
          status: 'failed',
          title: 'supports keyboard navigation',
        },
        {
          ancestorTitles: ['KDSMainContent', 'Accessibility'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:482:53)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent Accessibility maintains focus management in different view modes',
          status: 'failed',
          title: 'maintains focus management in different view modes',
        },
        {
          ancestorTitles: ['KDSMainContent', 'Error Recovery'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:500:47)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent Error Recovery recovers from error state when data loads successfully',
          status: 'failed',
          title: 'recovers from error state when data loads successfully',
        },
        {
          ancestorTitles: ['KDSMainContent', 'Error Recovery'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:515:47)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent Error Recovery clears error when switching between states',
          status: 'failed',
          title: 'clears error when switching between states',
        },
        {
          ancestorTitles: ['KDSMainContent', 'Styling and Layout'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:531:48)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent Styling and Layout applies custom className',
          status: 'failed',
          title: 'applies custom className',
        },
        {
          ancestorTitles: ['KDSMainContent', 'Styling and Layout'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:539:48)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent Styling and Layout maintains responsive grid layout',
          status: 'failed',
          title: 'maintains responsive grid layout',
        },
        {
          ancestorTitles: ['KDSMainContent', 'Styling and Layout'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-main-content.test.tsx:546:48)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSMainContent Styling and Layout applies proper spacing and padding',
          status: 'failed',
          title: 'applies proper spacing and padding',
        },
      ],
    },
    {
      numFailingTests: 41,
      numPassingTests: 0,
      numPendingTests: 0,
      numTodoTests: 0,
      perfStats: {
        end: 1749868558407,
        runtime: 816,
        slow: false,
        start: 1749868557591,
      },
      testFilePath:
        '/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx',
      failureMessage:
        '  ● KDSHeader › Rendering › renders with default props\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:53:26)\n\n  ● KDSHeader › Rendering › applies custom className\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:62:48)\n\n  ● KDSHeader › Rendering › renders fullscreen toggle when onToggleFullscreen is provided\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:71:26)\n\n  ● KDSHeader › Rendering › does not render fullscreen toggle when onToggleFullscreen is not provided\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:79:26)\n\n  ● KDSHeader › Connection Status › shows connected status when connected\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:88:26)\n\n  ● KDSHeader › Connection Status › shows disconnected status when disconnected\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:96:26)\n\n  ● KDSHeader › Connection Status › shows reconnecting status when reconnecting\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:104:26)\n\n  ● KDSHeader › Order Metrics › displays correct total order count\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:119:26)\n\n  ● KDSHeader › Order Metrics › calculates active orders correctly\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:131:26)\n\n  ● KDSHeader › Order Metrics › shows green badge for low active orders (<=5)\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:144:48)\n\n  ● KDSHeader › Order Metrics › shows yellow badge for medium active orders (6-10)\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:156:48)\n\n  ● KDSHeader › Order Metrics › shows red badge for high active orders (>10)\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:168:48)\n\n  ● KDSHeader › Station Selector › renders station selector with all stations\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:178:43)\n\n  ● KDSHeader › Station Selector › allows station selection\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:194:43)\n\n  ● KDSHeader › Filter Controls › renders filter dropdown\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:206:43)\n\n  ● KDSHeader › Filter Controls › calls setFilterBy when filter is changed\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:219:43)\n\n  ● KDSHeader › Filter Controls › shows current filter value\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:230:26)\n\n  ● KDSHeader › View Mode Controls › renders all view mode buttons\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:238:26)\n\n  ● KDSHeader › View Mode Controls › highlights active view mode\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:251:48)\n\n  ● KDSHeader › View Mode Controls › calls setViewMode when view mode is changed\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:259:43)\n\n  ● KDSHeader › Audio Controls › shows volume icon when sound is enabled\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:277:26)\n\n  ● KDSHeader › Audio Controls › shows muted icon when sound is disabled\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:286:26)\n\n  ● KDSHeader › Audio Controls › calls toggleSound when audio button is clicked\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:294:43)\n\n  ● KDSHeader › Action Buttons › renders refresh button\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:305:26)\n\n  ● KDSHeader › Action Buttons › calls refetch when refresh button is clicked\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:312:43)\n\n  ● KDSHeader › Action Buttons › disables refresh button when loading\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:322:26)\n\n  ● KDSHeader › Action Buttons › shows spinning icon when loading\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:330:48)\n\n  ● KDSHeader › Action Buttons › renders settings button\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:337:26)\n\n  ● KDSHeader › Fullscreen Controls › shows minimize icon when in fullscreen\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:347:26)\n\n  ● KDSHeader › Fullscreen Controls › shows maximize icon when not in fullscreen\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:357:26)\n\n  ● KDSHeader › Fullscreen Controls › calls onToggleFullscreen when fullscreen button is clicked\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:367:43)\n\n  ● KDSHeader › Accessibility › has proper ARIA labels\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:380:26)\n\n  ● KDSHeader › Accessibility › supports keyboard navigation\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:395:43)\n\n  ● KDSHeader › Accessibility › has semantic HTML structure\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:406:26)\n\n  ● KDSHeader › Performance › memoizes sub-components to prevent unnecessary re-renders\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:416:47)\n\n  ● KDSHeader › Performance › handles rapid state changes efficiently\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:433:43)\n\n  ● KDSHeader › Error Handling › gracefully handles missing KDS state\n\n    expect(received).not.toThrow()\n\n    Error name:    "TypeError"\n    Error message: "Cannot redefine property: clipboard"\n\n          102 |   )\n          103 |\n        > 104 |   const userEventInstance = userEvent.setup()\n              |                                       ^\n          105 |\n          106 |   return {\n          107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at __tests__/unit/components/kds/kds-header.test.tsx:454:28\n      at Object.<anonymous> (node_modules/expect/build/toThrowMatchers.js:74:11)\n      at Object.throwingMatcher [as toThrow] (node_modules/expect/build/index.js:320:21)\n      at Object.toThrow (__tests__/unit/components/kds/kds-header.test.tsx:455:14)\n      at Object.toThrow (__tests__/unit/components/kds/kds-header.test.tsx:455:14)\n\n  ● KDSHeader › Error Handling › displays error state when appropriate\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:462:26)\n\n  ● KDSHeader › Real-time Updates › updates metrics when orders change\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:470:47)\n\n  ● KDSHeader › Real-time Updates › updates connection status in real-time\n\n    TypeError: Cannot redefine property: clipboard\n        at Object.defineProperty (<anonymous>)\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at Object.<anonymous> (__tests__/unit/components/kds/kds-header.test.tsx:487:47)\n\n  ● KDSHeader › Integration › works with all KDS state combinations\n\n    expect(received).not.toThrow()\n\n    Error name:    "TypeError"\n    Error message: "Cannot redefine property: clipboard"\n\n          102 |   )\n          103 |\n        > 104 |   const userEventInstance = userEvent.setup()\n              |                                       ^\n          105 |\n          106 |   return {\n          107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at __tests__/unit/components/kds/kds-header.test.tsx:525:30\n      at Object.<anonymous> (node_modules/expect/build/toThrowMatchers.js:74:11)\n      at Object.throwingMatcher [as toThrow] (node_modules/expect/build/index.js:320:21)\n      at toThrow (__tests__/unit/components/kds/kds-header.test.tsx:526:16)\n                at Array.forEach (<anonymous>)\n      at Object.forEach (__tests__/unit/components/kds/kds-header.test.tsx:521:17)\n      at toThrow (__tests__/unit/components/kds/kds-header.test.tsx:526:16)\n          at Array.forEach (<anonymous>)\n      at Object.forEach (__tests__/unit/components/kds/kds-header.test.tsx:521:17)\n',
      testResults: [
        {
          ancestorTitles: ['KDSHeader', 'Rendering'],
          duration: 10,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:53:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName: 'KDSHeader Rendering renders with default props',
          status: 'failed',
          title: 'renders with default props',
        },
        {
          ancestorTitles: ['KDSHeader', 'Rendering'],
          duration: 1,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:62:48)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName: 'KDSHeader Rendering applies custom className',
          status: 'failed',
          title: 'applies custom className',
        },
        {
          ancestorTitles: ['KDSHeader', 'Rendering'],
          duration: 1,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:71:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader Rendering renders fullscreen toggle when onToggleFullscreen is provided',
          status: 'failed',
          title:
            'renders fullscreen toggle when onToggleFullscreen is provided',
        },
        {
          ancestorTitles: ['KDSHeader', 'Rendering'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:79:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader Rendering does not render fullscreen toggle when onToggleFullscreen is not provided',
          status: 'failed',
          title:
            'does not render fullscreen toggle when onToggleFullscreen is not provided',
        },
        {
          ancestorTitles: ['KDSHeader', 'Connection Status'],
          duration: 1,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:88:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader Connection Status shows connected status when connected',
          status: 'failed',
          title: 'shows connected status when connected',
        },
        {
          ancestorTitles: ['KDSHeader', 'Connection Status'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:96:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader Connection Status shows disconnected status when disconnected',
          status: 'failed',
          title: 'shows disconnected status when disconnected',
        },
        {
          ancestorTitles: ['KDSHeader', 'Connection Status'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:104:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader Connection Status shows reconnecting status when reconnecting',
          status: 'failed',
          title: 'shows reconnecting status when reconnecting',
        },
        {
          ancestorTitles: ['KDSHeader', 'Order Metrics'],
          duration: 1,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:119:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader Order Metrics displays correct total order count',
          status: 'failed',
          title: 'displays correct total order count',
        },
        {
          ancestorTitles: ['KDSHeader', 'Order Metrics'],
          duration: 1,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:131:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader Order Metrics calculates active orders correctly',
          status: 'failed',
          title: 'calculates active orders correctly',
        },
        {
          ancestorTitles: ['KDSHeader', 'Order Metrics'],
          duration: 2,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:144:48)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader Order Metrics shows green badge for low active orders (<=5)',
          status: 'failed',
          title: 'shows green badge for low active orders (<=5)',
        },
        {
          ancestorTitles: ['KDSHeader', 'Order Metrics'],
          duration: 13,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:156:48)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader Order Metrics shows yellow badge for medium active orders (6-10)',
          status: 'failed',
          title: 'shows yellow badge for medium active orders (6-10)',
        },
        {
          ancestorTitles: ['KDSHeader', 'Order Metrics'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:168:48)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader Order Metrics shows red badge for high active orders (>10)',
          status: 'failed',
          title: 'shows red badge for high active orders (>10)',
        },
        {
          ancestorTitles: ['KDSHeader', 'Station Selector'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:178:43)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader Station Selector renders station selector with all stations',
          status: 'failed',
          title: 'renders station selector with all stations',
        },
        {
          ancestorTitles: ['KDSHeader', 'Station Selector'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:194:43)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName: 'KDSHeader Station Selector allows station selection',
          status: 'failed',
          title: 'allows station selection',
        },
        {
          ancestorTitles: ['KDSHeader', 'Filter Controls'],
          duration: 1,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:206:43)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName: 'KDSHeader Filter Controls renders filter dropdown',
          status: 'failed',
          title: 'renders filter dropdown',
        },
        {
          ancestorTitles: ['KDSHeader', 'Filter Controls'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:219:43)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader Filter Controls calls setFilterBy when filter is changed',
          status: 'failed',
          title: 'calls setFilterBy when filter is changed',
        },
        {
          ancestorTitles: ['KDSHeader', 'Filter Controls'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:230:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName: 'KDSHeader Filter Controls shows current filter value',
          status: 'failed',
          title: 'shows current filter value',
        },
        {
          ancestorTitles: ['KDSHeader', 'View Mode Controls'],
          duration: 1,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:238:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader View Mode Controls renders all view mode buttons',
          status: 'failed',
          title: 'renders all view mode buttons',
        },
        {
          ancestorTitles: ['KDSHeader', 'View Mode Controls'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:251:48)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName: 'KDSHeader View Mode Controls highlights active view mode',
          status: 'failed',
          title: 'highlights active view mode',
        },
        {
          ancestorTitles: ['KDSHeader', 'View Mode Controls'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:259:43)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader View Mode Controls calls setViewMode when view mode is changed',
          status: 'failed',
          title: 'calls setViewMode when view mode is changed',
        },
        {
          ancestorTitles: ['KDSHeader', 'Audio Controls'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:277:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader Audio Controls shows volume icon when sound is enabled',
          status: 'failed',
          title: 'shows volume icon when sound is enabled',
        },
        {
          ancestorTitles: ['KDSHeader', 'Audio Controls'],
          duration: 1,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:286:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader Audio Controls shows muted icon when sound is disabled',
          status: 'failed',
          title: 'shows muted icon when sound is disabled',
        },
        {
          ancestorTitles: ['KDSHeader', 'Audio Controls'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:294:43)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader Audio Controls calls toggleSound when audio button is clicked',
          status: 'failed',
          title: 'calls toggleSound when audio button is clicked',
        },
        {
          ancestorTitles: ['KDSHeader', 'Action Buttons'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:305:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName: 'KDSHeader Action Buttons renders refresh button',
          status: 'failed',
          title: 'renders refresh button',
        },
        {
          ancestorTitles: ['KDSHeader', 'Action Buttons'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:312:43)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader Action Buttons calls refetch when refresh button is clicked',
          status: 'failed',
          title: 'calls refetch when refresh button is clicked',
        },
        {
          ancestorTitles: ['KDSHeader', 'Action Buttons'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:322:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader Action Buttons disables refresh button when loading',
          status: 'failed',
          title: 'disables refresh button when loading',
        },
        {
          ancestorTitles: ['KDSHeader', 'Action Buttons'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:330:48)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName: 'KDSHeader Action Buttons shows spinning icon when loading',
          status: 'failed',
          title: 'shows spinning icon when loading',
        },
        {
          ancestorTitles: ['KDSHeader', 'Action Buttons'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:337:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName: 'KDSHeader Action Buttons renders settings button',
          status: 'failed',
          title: 'renders settings button',
        },
        {
          ancestorTitles: ['KDSHeader', 'Fullscreen Controls'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:347:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader Fullscreen Controls shows minimize icon when in fullscreen',
          status: 'failed',
          title: 'shows minimize icon when in fullscreen',
        },
        {
          ancestorTitles: ['KDSHeader', 'Fullscreen Controls'],
          duration: 12,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:357:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader Fullscreen Controls shows maximize icon when not in fullscreen',
          status: 'failed',
          title: 'shows maximize icon when not in fullscreen',
        },
        {
          ancestorTitles: ['KDSHeader', 'Fullscreen Controls'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:367:43)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader Fullscreen Controls calls onToggleFullscreen when fullscreen button is clicked',
          status: 'failed',
          title: 'calls onToggleFullscreen when fullscreen button is clicked',
        },
        {
          ancestorTitles: ['KDSHeader', 'Accessibility'],
          duration: 1,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:380:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName: 'KDSHeader Accessibility has proper ARIA labels',
          status: 'failed',
          title: 'has proper ARIA labels',
        },
        {
          ancestorTitles: ['KDSHeader', 'Accessibility'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:395:43)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName: 'KDSHeader Accessibility supports keyboard navigation',
          status: 'failed',
          title: 'supports keyboard navigation',
        },
        {
          ancestorTitles: ['KDSHeader', 'Accessibility'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:406:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName: 'KDSHeader Accessibility has semantic HTML structure',
          status: 'failed',
          title: 'has semantic HTML structure',
        },
        {
          ancestorTitles: ['KDSHeader', 'Performance'],
          duration: 1,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:416:47)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader Performance memoizes sub-components to prevent unnecessary re-renders',
          status: 'failed',
          title: 'memoizes sub-components to prevent unnecessary re-renders',
        },
        {
          ancestorTitles: ['KDSHeader', 'Performance'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:433:43)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader Performance handles rapid state changes efficiently',
          status: 'failed',
          title: 'handles rapid state changes efficiently',
        },
        {
          ancestorTitles: ['KDSHeader', 'Error Handling'],
          duration: 11,
          failureMessages: [
            'Error: expect(received).not.toThrow()\n\nError name:    "TypeError"\nError message: "Cannot redefine property: clipboard"\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at __tests__/unit/components/kds/kds-header.test.tsx:454:28\n      at Object.<anonymous> (node_modules/expect/build/toThrowMatchers.js:74:11)\n      at Object.throwingMatcher [as toThrow] (node_modules/expect/build/index.js:320:21)\n      at Object.toThrow (__tests__/unit/components/kds/kds-header.test.tsx:455:14)\n    at Object.toThrow (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:455:14)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader Error Handling gracefully handles missing KDS state',
          status: 'failed',
          title: 'gracefully handles missing KDS state',
        },
        {
          ancestorTitles: ['KDSHeader', 'Error Handling'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:462:26)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader Error Handling displays error state when appropriate',
          status: 'failed',
          title: 'displays error state when appropriate',
        },
        {
          ancestorTitles: ['KDSHeader', 'Real-time Updates'],
          duration: 0,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:470:47)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader Real-time Updates updates metrics when orders change',
          status: 'failed',
          title: 'updates metrics when orders change',
        },
        {
          ancestorTitles: ['KDSHeader', 'Real-time Updates'],
          duration: 1,
          failureMessages: [
            'TypeError: Cannot redefine property: clipboard\n    at Object.defineProperty (<anonymous>)\n    at Object.attachClipboardStubToView (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n    at Object.setupMain [as setup] (/Users/mike/Plate-Restaurant-System-App/node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n    at setup (/Users/mike/Plate-Restaurant-System-App/__tests__/utils/test-utils.tsx:104:39)\n    at Object.<anonymous> (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:487:47)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader Real-time Updates updates connection status in real-time',
          status: 'failed',
          title: 'updates connection status in real-time',
        },
        {
          ancestorTitles: ['KDSHeader', 'Integration'],
          duration: 1,
          failureMessages: [
            'Error: expect(received).not.toThrow()\n\nError name:    "TypeError"\nError message: "Cannot redefine property: clipboard"\n\n      102 |   )\n      103 |\n    > 104 |   const userEventInstance = userEvent.setup()\n          |                                       ^\n      105 |\n      106 |   return {\n      107 |     user: userEventInstance,\n\n      at Object.attachClipboardStubToView (node_modules/@testing-library/user-event/dist/cjs/utils/dataTransfer/Clipboard.js:110:12)\n      at Object.setupMain [as setup] (node_modules/@testing-library/user-event/dist/cjs/setup/setup.js:58:15)\n      at setup (__tests__/utils/test-utils.tsx:104:39)\n      at __tests__/unit/components/kds/kds-header.test.tsx:525:30\n      at Object.<anonymous> (node_modules/expect/build/toThrowMatchers.js:74:11)\n      at Object.throwingMatcher [as toThrow] (node_modules/expect/build/index.js:320:21)\n      at toThrow (__tests__/unit/components/kds/kds-header.test.tsx:526:16)\n          at Array.forEach (<anonymous>)\n      at Object.forEach (__tests__/unit/components/kds/kds-header.test.tsx:521:17)\n    at toThrow (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:526:16)\n    at Array.forEach (<anonymous>)\n    at Object.forEach (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/components/kds/kds-header.test.tsx:521:17)\n    at Promise.then.completed (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:298:28)\n    at new Promise (<anonymous>)\n    at callAsyncCircusFn (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/utils.js:231:10)\n    at _callCircusTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:316:40)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at _runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:252:3)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:126:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at _runTestsForDescribeBlock (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:121:9)\n    at run (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/run.js:71:3)\n    at runAndTransformResultsToJestFormat (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)\n    at jestAdapter (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)\n    at runTestInternal (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:367:16)\n    at runTest (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/runTest.js:444:34)\n    at Object.worker (/Users/mike/Plate-Restaurant-System-App/node_modules/jest-runner/build/testWorker.js:106:12)',
          ],
          fullName:
            'KDSHeader Integration works with all KDS state combinations',
          status: 'failed',
          title: 'works with all KDS state combinations',
        },
      ],
    },
    {
      numFailingTests: 1,
      numPassingTests: 26,
      numPendingTests: 0,
      numTodoTests: 0,
      perfStats: {
        end: 1749868559599,
        runtime: 2010,
        slow: false,
        start: 1749868557589,
      },
      testFilePath:
        '/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/state/domains/orders-context.test.tsx',
      failureMessage:
        '  ● OrdersContext › Order Statistics › calculates order statistics correctly\n\n    expect(received).toBe(expected) // Object.is equality\n\n    Expected: 1\n    Received: NaN\n\n      406 |       \n      407 |       expect(stats.total).toBe(4)\n    > 408 |       expect(stats.byStatus.pending).toBe(1)\n          |                                      ^\n      409 |       expect(stats.byStatus.ready).toBe(2)\n      410 |       expect(stats.byStatus.served).toBe(1)\n      411 |       expect(stats.pendingCount).toBe(1)\n\n      at Object.toBe (__tests__/unit/lib/state/domains/orders-context.test.tsx:408:38)\n',
      testResults: [
        {
          ancestorTitles: ['OrdersContext', 'Provider Initialization'],
          duration: 75,
          failureMessages: [],
          fullName:
            'OrdersContext Provider Initialization provides initial state',
          status: 'passed',
          title: 'provides initial state',
        },
        {
          ancestorTitles: ['OrdersContext', 'Provider Initialization'],
          duration: 75,
          failureMessages: [],
          fullName:
            'OrdersContext Provider Initialization loads orders on mount',
          status: 'passed',
          title: 'loads orders on mount',
        },
        {
          ancestorTitles: ['OrdersContext', 'Provider Initialization'],
          duration: 55,
          failureMessages: [],
          fullName:
            'OrdersContext Provider Initialization handles loading error gracefully',
          status: 'passed',
          title: 'handles loading error gracefully',
        },
        {
          ancestorTitles: ['OrdersContext', 'Order Operations'],
          duration: 4,
          failureMessages: [],
          fullName: 'OrdersContext Order Operations creates new order',
          status: 'passed',
          title: 'creates new order',
        },
        {
          ancestorTitles: ['OrdersContext', 'Order Operations'],
          duration: 56,
          failureMessages: [],
          fullName: 'OrdersContext Order Operations updates existing order',
          status: 'passed',
          title: 'updates existing order',
        },
        {
          ancestorTitles: ['OrdersContext', 'Order Operations'],
          duration: 54,
          failureMessages: [],
          fullName: 'OrdersContext Order Operations removes order',
          status: 'passed',
          title: 'removes order',
        },
        {
          ancestorTitles: ['OrdersContext', 'Order Operations'],
          duration: 6,
          failureMessages: [],
          fullName: 'OrdersContext Order Operations handles operation errors',
          status: 'passed',
          title: 'handles operation errors',
        },
        {
          ancestorTitles: ['OrdersContext', 'Optimistic Updates'],
          duration: 54,
          failureMessages: [],
          fullName:
            'OrdersContext Optimistic Updates applies optimistic updates immediately',
          status: 'passed',
          title: 'applies optimistic updates immediately',
        },
        {
          ancestorTitles: ['OrdersContext', 'Optimistic Updates'],
          duration: 57,
          failureMessages: [],
          fullName:
            'OrdersContext Optimistic Updates clears optimistic updates on successful real update',
          status: 'passed',
          title: 'clears optimistic updates on successful real update',
        },
        {
          ancestorTitles: ['OrdersContext', 'Optimistic Updates'],
          duration: 63,
          failureMessages: [],
          fullName:
            'OrdersContext Optimistic Updates clears optimistic updates on operation error',
          status: 'passed',
          title: 'clears optimistic updates on operation error',
        },
        {
          ancestorTitles: ['OrdersContext', 'Optimistic Updates'],
          duration: 58,
          failureMessages: [],
          fullName:
            'OrdersContext Optimistic Updates merges multiple optimistic updates',
          status: 'passed',
          title: 'merges multiple optimistic updates',
        },
        {
          ancestorTitles: ['OrdersContext', 'Query Functions'],
          duration: 58,
          failureMessages: [],
          fullName: 'OrdersContext Query Functions gets order by ID',
          status: 'passed',
          title: 'gets order by ID',
        },
        {
          ancestorTitles: ['OrdersContext', 'Query Functions'],
          duration: 60,
          failureMessages: [],
          fullName: 'OrdersContext Query Functions gets orders by status',
          status: 'passed',
          title: 'gets orders by status',
        },
        {
          ancestorTitles: ['OrdersContext', 'Query Functions'],
          duration: 60,
          failureMessages: [],
          fullName: 'OrdersContext Query Functions gets orders by table',
          status: 'passed',
          title: 'gets orders by table',
        },
        {
          ancestorTitles: ['OrdersContext', 'Query Functions'],
          duration: 58,
          failureMessages: [],
          fullName: 'OrdersContext Query Functions gets orders by resident',
          status: 'passed',
          title: 'gets orders by resident',
        },
        {
          ancestorTitles: ['OrdersContext', 'Query Functions'],
          duration: 58,
          failureMessages: [],
          fullName: 'OrdersContext Query Functions gets active orders',
          status: 'passed',
          title: 'gets active orders',
        },
        {
          ancestorTitles: ['OrdersContext', 'Order Statistics'],
          duration: 59,
          failureMessages: [
            'Error: expect(received).toBe(expected) // Object.is equality\n\nExpected: 1\nReceived: NaN\n    at Object.toBe (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/state/domains/orders-context.test.tsx:408:38)',
          ],
          fullName:
            'OrdersContext Order Statistics calculates order statistics correctly',
          status: 'failed',
          title: 'calculates order statistics correctly',
        },
        {
          ancestorTitles: ['OrdersContext', 'Order Statistics'],
          duration: 60,
          failureMessages: [],
          fullName: 'OrdersContext Order Statistics handles empty order list',
          status: 'passed',
          title: 'handles empty order list',
        },
        {
          ancestorTitles: ['OrdersContext', 'Convenience Hooks'],
          duration: 60,
          failureMessages: [],
          fullName:
            'OrdersContext Convenience Hooks useOrdersData provides read-only data',
          status: 'passed',
          title: 'useOrdersData provides read-only data',
        },
        {
          ancestorTitles: ['OrdersContext', 'Convenience Hooks'],
          duration: 59,
          failureMessages: [],
          fullName:
            'OrdersContext Convenience Hooks useActiveOrders provides active orders only',
          status: 'passed',
          title: 'useActiveOrders provides active orders only',
        },
        {
          ancestorTitles: ['OrdersContext', 'Error Handling'],
          duration: 27,
          failureMessages: [],
          fullName:
            'OrdersContext Error Handling throws error when used outside provider',
          status: 'passed',
          title: 'throws error when used outside provider',
        },
        {
          ancestorTitles: ['OrdersContext', 'Error Handling'],
          duration: 57,
          failureMessages: [],
          fullName:
            'OrdersContext Error Handling handles concurrent operations gracefully',
          status: 'passed',
          title: 'handles concurrent operations gracefully',
        },
        {
          ancestorTitles: ['OrdersContext', 'Error Handling'],
          duration: 60,
          failureMessages: [],
          fullName:
            'OrdersContext Error Handling maintains state consistency on partial failures',
          status: 'passed',
          title: 'maintains state consistency on partial failures',
        },
        {
          ancestorTitles: ['OrdersContext', 'Performance'],
          duration: 60,
          failureMessages: [],
          fullName:
            'OrdersContext Performance memoizes computed values correctly',
          status: 'passed',
          title: 'memoizes computed values correctly',
        },
        {
          ancestorTitles: ['OrdersContext', 'Performance'],
          duration: 71,
          failureMessages: [],
          fullName:
            'OrdersContext Performance handles large datasets efficiently',
          status: 'passed',
          title: 'handles large datasets efficiently',
        },
        {
          ancestorTitles: ['OrdersContext', 'Real-time Updates'],
          duration: 6,
          failureMessages: [],
          fullName:
            'OrdersContext Real-time Updates configures real-time subscription when enabled',
          status: 'passed',
          title: 'configures real-time subscription when enabled',
        },
        {
          ancestorTitles: ['OrdersContext', 'Real-time Updates'],
          duration: 5,
          failureMessages: [],
          fullName:
            'OrdersContext Real-time Updates configures auto-refresh when enabled',
          status: 'passed',
          title: 'configures auto-refresh when enabled',
        },
      ],
    },
    {
      numFailingTests: 1,
      numPassingTests: 15,
      numPendingTests: 0,
      numTodoTests: 0,
      perfStats: {
        end: 1749868571573,
        runtime: 13951,
        slow: true,
        start: 1749868557622,
      },
      testFilePath:
        '/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/voice-ordering/batch-processor.test.ts',
      failureMessage:
        '  ● BatchProcessor › Priority Modes › should process shortest files first when configured\n\n    expect(received).toEqual(expected) // deep equality\n\n    - Expected  - 1\n    + Received  + 1\n\n      Array [\n    +   "large.wav",\n        "small.wav",\n        "medium.wav",\n    -   "large.wav",\n      ]\n\n      173 |       await new Promise(resolve => setTimeout(resolve, 500))\n      174 |       \n    > 175 |       expect(processingOrder).toEqual([\'small.wav\', \'medium.wav\', \'large.wav\'])\n          |                               ^\n      176 |     })\n      177 |   })\n      178 |\n\n      at Object.toEqual (__tests__/unit/lib/voice-ordering/batch-processor.test.ts:175:31)\n',
      testResults: [
        {
          ancestorTitles: ['BatchProcessor', 'Batch Job Management'],
          duration: 9,
          failureMessages: [],
          fullName:
            'BatchProcessor Batch Job Management should submit and track batch jobs',
          status: 'passed',
          title: 'should submit and track batch jobs',
        },
        {
          ancestorTitles: ['BatchProcessor', 'Batch Job Management'],
          duration: 1007,
          failureMessages: [],
          fullName:
            'BatchProcessor Batch Job Management should process jobs with concurrency control',
          status: 'passed',
          title: 'should process jobs with concurrency control',
        },
        {
          ancestorTitles: ['BatchProcessor', 'Priority Modes'],
          duration: 504,
          failureMessages: [],
          fullName:
            'BatchProcessor Priority Modes should process jobs in FIFO order by default',
          status: 'passed',
          title: 'should process jobs in FIFO order by default',
        },
        {
          ancestorTitles: ['BatchProcessor', 'Priority Modes'],
          duration: 514,
          failureMessages: [
            'Error: expect(received).toEqual(expected) // deep equality\n\n- Expected  - 1\n+ Received  + 1\n\n  Array [\n+   "large.wav",\n    "small.wav",\n    "medium.wav",\n-   "large.wav",\n  ]\n    at Object.toEqual (/Users/mike/Plate-Restaurant-System-App/__tests__/unit/lib/voice-ordering/batch-processor.test.ts:175:31)',
          ],
          fullName:
            'BatchProcessor Priority Modes should process shortest files first when configured',
          status: 'failed',
          title: 'should process shortest files first when configured',
        },
        {
          ancestorTitles: ['BatchProcessor', 'Error Handling and Retries'],
          duration: 1006,
          failureMessages: [],
          fullName:
            'BatchProcessor Error Handling and Retries should handle transcription failures gracefully',
          status: 'passed',
          title: 'should handle transcription failures gracefully',
        },
        {
          ancestorTitles: ['BatchProcessor', 'Error Handling and Retries'],
          duration: 1006,
          failureMessages: [],
          fullName:
            'BatchProcessor Error Handling and Retries should timeout long-running jobs',
          status: 'passed',
          title: 'should timeout long-running jobs',
        },
        {
          ancestorTitles: ['BatchProcessor', 'Batch Progress Tracking'],
          duration: 1006,
          failureMessages: [],
          fullName:
            'BatchProcessor Batch Progress Tracking should provide accurate progress updates',
          status: 'passed',
          title: 'should provide accurate progress updates',
        },
        {
          ancestorTitles: ['BatchProcessor', 'Batch Progress Tracking'],
          duration: 306,
          failureMessages: [],
          fullName:
            'BatchProcessor Batch Progress Tracking should calculate estimated time remaining',
          status: 'passed',
          title: 'should calculate estimated time remaining',
        },
        {
          ancestorTitles: ['BatchProcessor', 'Cost Efficiency'],
          duration: 1006,
          failureMessages: [],
          fullName:
            'BatchProcessor Cost Efficiency should reduce overhead through batch processing',
          status: 'passed',
          title: 'should reduce overhead through batch processing',
        },
        {
          ancestorTitles: ['BatchProcessor', 'Cost Efficiency'],
          duration: 1007,
          failureMessages: [],
          fullName:
            'BatchProcessor Cost Efficiency should provide batch processing statistics',
          status: 'passed',
          title: 'should provide batch processing statistics',
        },
        {
          ancestorTitles: ['BatchProcessor', 'Optimized Batch Processing'],
          duration: 1005,
          failureMessages: [],
          fullName:
            'BatchProcessor Optimized Batch Processing should group similar audio files for better cache hits',
          status: 'passed',
          title: 'should group similar audio files for better cache hits',
        },
        {
          ancestorTitles: ['BatchProcessor', 'Optimized Batch Processing'],
          duration: 1004,
          failureMessages: [],
          fullName:
            'BatchProcessor Optimized Batch Processing should maintain efficiency with mixed file sizes',
          status: 'passed',
          title: 'should maintain efficiency with mixed file sizes',
        },
        {
          ancestorTitles: ['BatchProcessor', 'Convenience Functions'],
          duration: 1004,
          failureMessages: [],
          fullName:
            'BatchProcessor Convenience Functions should work with the convenience batch function',
          status: 'passed',
          title: 'should work with the convenience batch function',
        },
        {
          ancestorTitles: ['BatchProcessor', 'Convenience Functions'],
          duration: 1004,
          failureMessages: [],
          fullName:
            'BatchProcessor Convenience Functions should work with the optimized convenience function',
          status: 'passed',
          title: 'should work with the optimized convenience function',
        },
        {
          ancestorTitles: ['BatchProcessor', 'Performance Benchmarks'],
          duration: 1008,
          failureMessages: [],
          fullName:
            'BatchProcessor Performance Benchmarks should process 20 jobs under 5 seconds with concurrency',
          status: 'passed',
          title: 'should process 20 jobs under 5 seconds with concurrency',
        },
        {
          ancestorTitles: ['BatchProcessor', 'Performance Benchmarks'],
          duration: 1007,
          failureMessages: [],
          fullName:
            'BatchProcessor Performance Benchmarks should maintain quality with high concurrency',
          status: 'passed',
          title: 'should maintain quality with high concurrency',
        },
      ],
    },
  ],
  config: {
    bail: 0,
    changedFilesWithAncestor: false,
    ci: false,
    collectCoverage: false,
    collectCoverageFrom: [
      '**/*.{js,jsx,ts,tsx}',
      '!**/*.d.ts',
      '!**/node_modules/**',
      '!**/.next/**',
      '!**/coverage/**',
      '!**/*.config.js',
      '!**/scripts/**',
      '!**/test-reports/**',
    ],
    coverageDirectory: '/Users/mike/Plate-Restaurant-System-App/coverage',
    coverageProvider: 'v8',
    coverageReporters: ['json', 'text', 'lcov', 'clover'],
    coverageThreshold: {
      global: { branches: 80, functions: 80, lines: 80, statements: 80 },
    },
    detectLeaks: false,
    detectOpenHandles: false,
    errorOnDeprecated: false,
    expand: false,
    findRelatedTests: false,
    forceExit: false,
    json: false,
    lastCommit: false,
    listTests: false,
    logHeapUsage: false,
    maxConcurrency: 5,
    maxWorkers: 7,
    noStackTrace: false,
    nonFlagArgs: [],
    notify: false,
    notifyMode: 'failure-change',
    onlyChanged: false,
    onlyFailures: false,
    openHandlesTimeout: 1000,
    passWithNoTests: false,
    projects: [
      {
        testEnvironment: 'jsdom',
        setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
        moduleNameMapper: {
          '^@/(.*)$': '<rootDir>/$1',
          '^@components/(.*)$': '<rootDir>/components/$1',
          '^@lib/(.*)$': '<rootDir>/lib/$1',
          '^@hooks/(.*)$': '<rootDir>/hooks/$1',
          '^@types/(.*)$': '<rootDir>/types/$1',
          '^@app/(.*)$': '<rootDir>/app/$1',
          '^@services/(.*)$': '<rootDir>/services/$1',
        },
        testPathIgnorePatterns: [
          '<rootDir>/.next/',
          '<rootDir>/node_modules/',
          '<rootDir>/coverage/',
        ],
        transform: {
          '^.+\\.(js|jsx|ts|tsx)$': [
            '/Users/mike/Plate-Restaurant-System-App/node_modules/babel-jest/build/index.js',
            { presets: ['next/babel'] },
          ],
        },
        transformIgnorePatterns: [
          '/node_modules/',
          '^.+\\.module\\.(css|sass|scss)$',
        ],
        displayName: 'unit',
        testMatch: [
          '<rootDir>/__tests__/unit/**/*.{test,spec}.{js,jsx,ts,tsx}',
        ],
        rootDir: '/Users/mike/Plate-Restaurant-System-App',
      },
      {
        testEnvironment: 'jsdom',
        setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
        moduleNameMapper: {
          '^@/(.*)$': '<rootDir>/$1',
          '^@components/(.*)$': '<rootDir>/components/$1',
          '^@lib/(.*)$': '<rootDir>/lib/$1',
          '^@hooks/(.*)$': '<rootDir>/hooks/$1',
          '^@types/(.*)$': '<rootDir>/types/$1',
          '^@app/(.*)$': '<rootDir>/app/$1',
          '^@services/(.*)$': '<rootDir>/services/$1',
        },
        testPathIgnorePatterns: [
          '<rootDir>/.next/',
          '<rootDir>/node_modules/',
          '<rootDir>/coverage/',
        ],
        transform: {
          '^.+\\.(js|jsx|ts|tsx)$': [
            '/Users/mike/Plate-Restaurant-System-App/node_modules/babel-jest/build/index.js',
            { presets: ['next/babel'] },
          ],
        },
        transformIgnorePatterns: [
          '/node_modules/',
          '^.+\\.module\\.(css|sass|scss)$',
        ],
        displayName: 'integration',
        testMatch: [
          '<rootDir>/__tests__/integration/**/*.{test,spec}.{js,jsx,ts,tsx}',
        ],
        rootDir: '/Users/mike/Plate-Restaurant-System-App',
      },
      {
        testEnvironment: 'node',
        setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
        moduleNameMapper: {
          '^@/(.*)$': '<rootDir>/$1',
          '^@components/(.*)$': '<rootDir>/components/$1',
          '^@lib/(.*)$': '<rootDir>/lib/$1',
          '^@hooks/(.*)$': '<rootDir>/hooks/$1',
          '^@types/(.*)$': '<rootDir>/types/$1',
          '^@app/(.*)$': '<rootDir>/app/$1',
          '^@services/(.*)$': '<rootDir>/services/$1',
        },
        testPathIgnorePatterns: [
          '<rootDir>/.next/',
          '<rootDir>/node_modules/',
          '<rootDir>/coverage/',
        ],
        transform: {
          '^.+\\.(js|jsx|ts|tsx)$': [
            '/Users/mike/Plate-Restaurant-System-App/node_modules/babel-jest/build/index.js',
            { presets: ['next/babel'] },
          ],
        },
        transformIgnorePatterns: [
          '/node_modules/',
          '^.+\\.module\\.(css|sass|scss)$',
        ],
        displayName: 'e2e',
        testMatch: ['<rootDir>/__tests__/e2e/**/*.{test,spec}.{js,jsx,ts,tsx}'],
        rootDir: '/Users/mike/Plate-Restaurant-System-App',
      },
      {
        testEnvironment: 'node',
        setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
        moduleNameMapper: {
          '^@/(.*)$': '<rootDir>/$1',
          '^@components/(.*)$': '<rootDir>/components/$1',
          '^@lib/(.*)$': '<rootDir>/lib/$1',
          '^@hooks/(.*)$': '<rootDir>/hooks/$1',
          '^@types/(.*)$': '<rootDir>/types/$1',
          '^@app/(.*)$': '<rootDir>/app/$1',
          '^@services/(.*)$': '<rootDir>/services/$1',
        },
        testPathIgnorePatterns: [
          '<rootDir>/.next/',
          '<rootDir>/node_modules/',
          '<rootDir>/coverage/',
        ],
        transform: {
          '^.+\\.(js|jsx|ts|tsx)$': [
            '/Users/mike/Plate-Restaurant-System-App/node_modules/babel-jest/build/index.js',
            { presets: ['next/babel'] },
          ],
        },
        transformIgnorePatterns: [
          '/node_modules/',
          '^.+\\.module\\.(css|sass|scss)$',
        ],
        displayName: 'performance',
        testMatch: [
          '<rootDir>/__tests__/performance/**/*.{test,spec}.{js,jsx,ts,tsx}',
        ],
        rootDir: '/Users/mike/Plate-Restaurant-System-App',
      },
    ],
    reporters: [
      ['default', {}],
      [
        '/Users/mike/Plate-Restaurant-System-App/node_modules/jest-junit/index.js',
        { outputDirectory: 'test-reports', outputName: 'junit.xml' },
      ],
      [
        '/Users/mike/Plate-Restaurant-System-App/node_modules/jest-html-reporters/index.js',
        {
          publicPath: 'test-reports/html',
          filename: 'report.html',
          expand: true,
        },
      ],
    ],
    rootDir: '/Users/mike/Plate-Restaurant-System-App',
    runTestsByPath: false,
    seed: -418979210,
    skipFilter: false,
    snapshotFormat: { escapeString: false, printBasicPrototype: false },
    testFailureExitCode: 1,
    testPathPattern: '__tests__/unit',
    testSequencer:
      '/Users/mike/Plate-Restaurant-System-App/node_modules/@jest/test-sequencer/build/index.js',
    updateSnapshot: 'new',
    useStderr: false,
    watch: false,
    watchAll: false,
    watchPlugins: [
      {
        config: {},
        path: '/Users/mike/Plate-Restaurant-System-App/node_modules/jest-watch-typeahead/build/file_name_plugin/plugin.js',
      },
      {
        config: {},
        path: '/Users/mike/Plate-Restaurant-System-App/node_modules/jest-watch-typeahead/build/test_name_plugin/plugin.js',
      },
    ],
    watchman: true,
    workerThreads: false,
  },
  endTime: 1749868571607,
  _reporterOptions: {
    publicPath: 'test-reports/html',
    filename: 'report.html',
    expand: true,
    pageTitle: '',
    hideIcon: false,
    testCommand: '',
    openReport: false,
    failureMessageOnly: 0,
    enableMergeData: false,
    dataMergeLevel: 1,
    inlineSource: false,
    urlForTestFiles: '',
    darkTheme: false,
    includeConsoleLog: false,
    stripSkippedTest: false,
  },
  logInfoMapping: {},
  attachInfos: {},
})
