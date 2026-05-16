// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CaptureBundleSchemas",
    platforms: [.iOS(.v15), .macOS(.v13)],
    products: [
        .library(name: "CaptureBundleSchemas", targets: ["CaptureBundleSchemas"]),
    ],
    targets: [
        .target(
            name: "CaptureBundleSchemas",
            path: "Sources/CaptureBundleSchemas"
        ),
        .testTarget(
            name: "CaptureBundleSchemasTests",
            dependencies: ["CaptureBundleSchemas"],
            path: "Tests/CaptureBundleSchemasTests"
        ),
    ]
)
