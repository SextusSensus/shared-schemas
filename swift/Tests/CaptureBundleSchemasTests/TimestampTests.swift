import XCTest
@testable import CaptureBundleSchemas

final class TimestampTests: XCTestCase {
    func testLeadingZeroRejected() throws {
        let json = #"{"timestamp_ns":"01","frame_id":0,"position_m":[0,0,0],"orientation_xyzw":[0,0,0,1]}"#
        let data = Data(json.utf8)
        let dec = JSONDecoder()
        XCTAssertThrowsError(try dec.decode(PoseSample.self, from: data))
    }
}
