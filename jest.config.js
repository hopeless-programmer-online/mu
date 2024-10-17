module.exports = {
    roots: [
        'src'
    ],
    collectCoverage: true,
    coverageDirectory: `<rootDir>/.jest/coverage`,
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
}
