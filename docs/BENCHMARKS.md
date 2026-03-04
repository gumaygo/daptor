# DAPTOR Benchmark & Evaluation Results

This document summarizes the empirical research conducted on DAPTOR (Dynamic Android Parallel Testing Orchestration Framework).

##  Summary of Experimental Results

Testing was conducted using two scenarios: 5 parallel emulators (n=5) and 10 parallel emulators (n=10), each with three repetitions.

| Metric | 5 Emulators | 10 Emulators |
| :--- | :---: | :---: |
| **Grand Mean Boot Time (s)** | 53.24 | 96.16 |
| **Success Rate (%)** | 100% | 100% |
| **Port Conflicts (count)** | 0 | 0 |

##  Scalability Analysis

The results show that while the boot time increases with the number of instances (~80.4% increase from 5 to 10 instances), the **reliability remains 100%**. 

The increased boot time at 10 instances is a trade-off for:
- **Zero Port Conflicts**: Guaranteed by atomic port holding.
- **Resource Stability**: Evenly distributed Appium sessions via cyclic assignment.
- **Full Automation**: Ready-to-test state with pre-configured animation scales.

##  Statistical Significance

Statistical tests (Mann-Whitney U and Welch t-test, α = 0.05) confirmed that DAPTOR's orchestration overhead is **not statistically significant** compared to manual/baseline launches.

- **5 Emulator p-value**: 0.934 (Mann-Whitney U)
- **10 Emulator p-value**: 0.277 (Mann-Whitney U)

This proves that you get the benefits of orchestration without a significant performance penalty.

---

