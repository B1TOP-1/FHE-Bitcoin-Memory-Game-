# 🔧 故障排除指南

## ❌ 常见错误及解决方案

### 1. `Cannot redefine property: ethereum`

**错误信息：**
```
Uncaught TypeError: Cannot redefine property: ethereum
    at Object.defineProperty (<anonymous>)
```

**原因：**
多个钱包扩展同时尝试注入 `window.ethereum`，导致冲突。

**解决方案：**

#### 方法 1：禁用其他钱包扩展（推荐）
1. 打开浏览器扩展管理页面
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
2. 禁用除 MetaMask 外的所有钱包扩展：
   - ❌ Backpack
   - ❌ Razor Wallet
   - ❌ Phantom
   - ❌ Coinbase Wallet
   - ✅ MetaMask（保留）
3. 刷新页面

#### 方法 2：使用隐身模式
1. 打开隐身/无痕窗口
2. 只启用 MetaMask 扩展
3. 访问 `http://localhost:3000`

#### 方法 3：使用不同的浏览器配置文件
1. 创建新的浏览器配置文件
2. 只安装 MetaMask
3. 使用该配置文件访问 dApp

---

### 2. `does not provide an export named 'getInstance'`

**错误信息：**
```
Uncaught SyntaxError: The requested module '/node_modules/.vite/deps/fhevmjs.js?v=fcebe19a' 
does not provide an export named 'getInstance'
```

**原因：**
`fhevmjs` 不导出 `getInstance` 函数。

**解决方案：**
✅ **已修复！** 导入语句已更新为：
```javascript
import { createInstance, initFhevm, getPublicKey } from 'fhevmjs';
```

如果仍有问题：
```bash
# 清除缓存
rm -rf node_modules/.vite
npm run dev
```

---

### 3. `Failed to load resource: 404 (favicon.ico)`

**错误信息：**
```
:3000/favicon.ico:1 Failed to load resource: the server responded with a status of 404
```

**原因：**
缺少网站图标文件。

**解决方案：**
✅ **已修复！** 已添加 `public/favicon.svg`

---

### 4. MetaMask 连接失败

**症状：**
- 点击 "Connect Wallet" 无反应
- MetaMask 不弹出

**解决方案：**

#### 检查 1：MetaMask 是否已安装
```javascript
// 在浏览器控制台运行
console.log(typeof window.ethereum); // 应该是 "object"
```

#### 检查 2：MetaMask 是否已解锁
1. 点击浏览器右上角的 MetaMask 图标
2. 输入密码解锁

#### 检查 3：清除站点权限
1. MetaMask → 设置 → 已连接的站点
2. 找到 `localhost:3000`
3. 点击 "断开连接"
4. 刷新页面重新连接

---

### 5. 网络错误：不在 Sepolia 测试网

**错误信息：**
```
Please switch to Sepolia Testnet
```

**解决方案：**

#### 方法 1：手动切换
1. 打开 MetaMask
2. 点击顶部网络下拉菜单
3. 选择 "Sepolia 测试网络"

#### 方法 2：添加 Sepolia 网络（如果没有）
1. MetaMask → 设置 → 网络 → 添加网络
2. 填写信息：
   - **网络名称**: Sepolia
   - **RPC URL**: `https://sepolia.infura.io/v3/YOUR_KEY`
   - **链 ID**: 11155111
   - **货币符号**: ETH
   - **区块浏览器**: `https://sepolia.etherscan.io`

---

### 6. 余额不足

**错误信息：**
```
insufficient funds for gas * price + value
```

**解决方案：**

获取免费的 Sepolia ETH：
1. [Sepolia Faucet](https://sepoliafaucet.com/)
2. [Alchemy Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
3. [Infura Faucet](https://www.infura.io/faucet/sepolia)

每个水龙头每天可领取 0.5 ETH。

---

### 7. FHEVM 初始化失败

**错误信息：**
```
FHEVM initialization failed
```

**可能原因：**
1. 网络连接问题
2. Relayer 服务不可用
3. 合约地址错误

**解决方案：**

#### 检查 1：网络连接
```bash
# 测试 Relayer 连接
curl https://gateway.sepolia.zama.ai
```

#### 检查 2：合约地址
确认 `app.js` 中的合约地址正确：
```javascript
const CONTRACT_ADDRESS = '0x3C19c7C6fdce6696D7445331B34ceFEe5C5Cdc32';
```

#### 检查 3：查看控制台日志
打开浏览器开发者工具 (F12)，查看详细错误信息。

**💡 注意：** 使用 Relayer SDK 后，解密过程会自动处理，**不需要手动调用 Gateway 解密**。

---

### 8. 交易失败

**错误信息：**
```
Transaction failed
```

**可能原因及解决方案：**

#### 原因 1：游戏状态不正确
- **问题**: 游戏已经开始，不能重复开始
- **解决**: 点击 "Reset Game" 重置游戏

#### 原因 2：时间未到
- **问题**: 10 秒未到就尝试 reveal
- **解决**: 等待倒计时结束

#### 原因 3：Gas 估算失败
- **问题**: 合约执行失败
- **解决**: 检查合约状态，尝试重置游戏

#### 原因 4：加密失败
- **问题**: FHE 加密出错
- **解决**: 刷新页面重新初始化 FHEVM

---

### 9. 开发服务器启动失败

**错误信息：**
```
Error: Cannot find module 'vite'
```

**解决方案：**
```bash
# 删除依赖
rm -rf node_modules package-lock.json

# 重新安装
npm install

# 启动
npm run dev
```

---

### 10. 浏览器兼容性问题

**支持的浏览器：**
- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ❌ IE（不支持）

**如果使用旧版本浏览器：**
1. 更新到最新版本
2. 或使用 Chrome/Edge

---

## 🔍 调试技巧

### 1. 查看控制台日志
按 `F12` 打开开发者工具，查看：
- Console: JavaScript 错误
- Network: 网络请求
- Application: 本地存储

### 2. 查看交易日志
在 UI 底部的 "Transaction Log" 区域查看：
- 🔵 Info: 信息
- 🟢 Success: 成功
- 🔴 Error: 错误

### 3. 在 Etherscan 查看交易
1. 复制交易哈希
2. 访问 [Sepolia Etherscan](https://sepolia.etherscan.io/)
3. 粘贴哈希查看详情

### 4. 查看合约状态
```javascript
// 在浏览器控制台运行
const isActive = await contract.isGameActive();
const hasPlayed = await contract.hasPlayed();
const timeRemaining = await contract.getTimeRemaining();

console.log({ isActive, hasPlayed, timeRemaining: timeRemaining.toString() });
```

---

## 📞 获取帮助

### 1. 查看文档
- [README.md](./README.md) - 项目概述
- [USAGE.md](./USAGE.md) - 详细使用指南

### 2. 检查日志
- 浏览器控制台 (F12)
- Transaction Log (UI 底部)

### 3. 重置一切
```bash
# 重置前端
rm -rf node_modules .vite
npm install
npm run dev

# 重置 MetaMask
# MetaMask → 设置 → 高级 → 重置账户
```

### 4. 社区资源
- [Zama Discord](https://discord.gg/zama)
- [Zama 文档](https://docs.zama.ai/fhevm)
- [GitHub Issues](https://github.com/zama-ai/fhevm)

---

## ✅ 快速检查清单

在报告问题前，请确认：

- [ ] MetaMask 已安装且已解锁
- [ ] 已禁用其他钱包扩展
- [ ] 已切换到 Sepolia 测试网
- [ ] 账户有足够的 Sepolia ETH
- [ ] 浏览器版本是最新的
- [ ] 已清除浏览器缓存
- [ ] 已查看控制台错误信息
- [ ] 已尝试刷新页面
- [ ] 已尝试重置游戏

---

## 🎯 最常见的问题

### 问题：钱包连接失败
**解决：** 禁用除 MetaMask 外的所有钱包扩展

### 问题：交易失败
**解决：** 点击 "Reset Game" 重置游戏状态

### 问题：余额不足
**解决：** 从水龙头获取 Sepolia ETH

### 问题：FHEVM 初始化失败
**解决：** 检查网络连接和合约地址

---

## ❌ Error: 0x91c183df - GameAlreadyActive

### 症状
```
Start game error: Error: execution reverted (unknown custom error) 
(data="0x91c183df", ...)
```

### 原因
您已经有一个活跃的游戏在进行中。合约不允许同时运行多个游戏。

### 解决方案

#### 方法 1：自动重置（已实现）✅
最新版本的前端会自动检测并重置之前的游戏：
```javascript
// 在 startGame() 函数中自动检查
const isActive = await contract.isGameActive();
if (isActive) {
    await contract.resetGame();
}
```

#### 方法 2：手动重置
1. 点击 "Reset Game" 按钮
2. 等待交易确认
3. 再次点击 "Start Game"

#### 方法 3：在控制台手动重置
```javascript
// 在浏览器控制台执行
const tx = await contract.resetGame();
await tx.wait();
console.log('Game reset!');
```

### 错误代码对照表

| 错误代码 | 错误名称 | 含义 |
|---------|---------|------|
| `0x91c183df` | `GameAlreadyActive()` | 已有活跃游戏 |
| `0xf966bb28` | `WaitTimeNotElapsed()` | 等待时间未过 |
| `0x256d9840` | `NoActiveGame()` | 没有活跃游戏 |
| `0xe40b4376` | `InvalidAppleChoice()` | 无效的苹果选择 |

### 如何避免
- 完成游戏流程后点击 "Reset Game"
- 刷新页面前先重置游戏
- 使用最新版本前端（已包含自动重置）

---

## ✅ 最新修复：解密功能 (2025-10-13)

### 问题 1: EIP-712 签名类型错误
**错误信息**: `Primary types requested for signing do not match the provided types`

**解决方案**: 根据 [Zama 官方文档](https://docs.zama.ai/protocol/relayer-sdk-guides/fhevm-relayer/decryption/user-decryption)修复

**关键修复点：**
1. ✅ EIP-712 类型名称：`UserDecryptRequestVerification`（之前错误使用了 `Reencrypt`）
2. ✅ 参数格式：`startTimeStamp` 和 `durationDays` 使用字符串格式
3. ✅ 签名处理：`signature.replace('0x', '')`
4. ✅ 方法调用：`signer.signTypedData()`

---

### 问题 2: Bad address checksum ⚠️
**错误信息**: `Error: Bad address checksum`

**原因**: Relayer SDK 的 WASM 模块要求所有以太坊地址必须是**正确的 EIP-55 checksum 格式**。

从 MetaMask 获取的地址 (`accounts[0]`) 可能是小写格式，而测试脚本中 Hardhat Signer 的 `alice.address` 自动返回 checksum 格式，这就是为什么测试脚本能成功而前端失败。

**解决方案**: 使用 `ethers.getAddress()` 转换所有地址

```javascript
// ❌ 错误 - 直接使用可能是小写的地址
const contractAddresses = [CONTRACT_ADDRESS];
const userAddr = userAddress;

// ✅ 正确 - 转换为 checksum 格式
const contractAddresses = [ethers.getAddress(CONTRACT_ADDRESS)];
const checksumUserAddress = ethers.getAddress(userAddress);
```

---

### 完整的正确解密代码

```javascript
// Generate keypair
const keypair = instance.generateKeypair();
const startTimeStamp = Math.floor(Date.now() / 1000).toString();
const durationDays = '10';

// CRITICAL: Convert addresses to checksum format
const contractAddresses = [ethers.getAddress(contractAddress)];
const checksumUserAddress = ethers.getAddress(userAddress);

// Create EIP-712 signature
const eip712 = instance.createEIP712(
  keypair.publicKey,
  contractAddresses,
  startTimeStamp,
  durationDays
);

// Sign
const signature = await signer.signTypedData(
  eip712.domain,
  { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
  eip712.message
);

// Decrypt
const result = await instance.userDecrypt(
  [{ handle: ciphertextHandle, contractAddress: contractAddresses[0] }],
  keypair.privateKey,
  keypair.publicKey,
  signature.replace('0x', ''),
  contractAddresses,
  checksumUserAddress, // Use checksum address
  startTimeStamp,
  durationDays
);
```

---

### 为什么测试脚本能成功？

测试脚本使用 Hardhat FHEVM 插件的 `fhevm.userDecryptEuint()` 方法，它是一个高级封装，内部自动处理了：
- ✅ 地址 checksum 转换
- ✅ EIP-712 签名流程
- ✅ 参数格式化

而前端直接调用 Relayer SDK 的底层 API，需要手动处理所有细节。

---

**祝您游戏愉快！** 🍎🍏🍊

