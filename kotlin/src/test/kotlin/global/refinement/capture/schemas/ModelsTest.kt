package global.refinement.capture.schemas

import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import kotlin.test.Test
import kotlin.test.assertFails

class ModelsTest {
    private val json = Json { ignoreUnknownKeys = true }

    @Test
    fun leadingZeroTimestampRejected() {
        val raw = """{"timestamp_ns":"01","frame_id":0,"position_m":[0.0,0.0,0.0],"orientation_xyzw":[0.0,0.0,0.0,1.0]}"""
        assertFails {
            json.decodeFromString<PoseSample>(raw)
        }
    }
}
