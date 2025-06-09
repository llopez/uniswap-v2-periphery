import { ethers } from 'ethers'
import * as fs from 'fs'
import path from 'path'

const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS
const WETH_ADDRESS = process.env.WETH_ADDRESS
const PRIVATE_KEY = process.env.PRIVATE_KEY
const RPC_URL = process.env.RPC_URL || 'http://localhost:8545'

const getArtifact = (name: string) => {
  const artifactPath = path.join(__dirname, `../build/${name}.json`)
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact not found: ${artifactPath}`)
  }
  return JSON.parse(fs.readFileSync(artifactPath, 'utf8'))
}

const getContractFactory = (name: string) => {
  if (!PRIVATE_KEY) {
    throw new Error('Please set PRIVATE_KEY in your environment.')
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL)
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider)

  const artifact = getArtifact(name)
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet)
  return factory
}

async function deployRouter(factoryAddress: string, wethAddress: string) {
  const factory = getContractFactory('UniswapV2Router02')
  console.log('Deploying UniswapV2Router02...')
  const contract = await factory.deploy(factoryAddress, wethAddress)
  await contract.waitForDeployment()
  const address = await contract.getAddress()
  console.log('UniswapV2Router02 deployed at:', address)
  return address
}

async function deployWETH() {
  const factory = getContractFactory('WETH9')
  console.log('Deploying WETH9...')
  const contract = await factory.deploy()
  await contract.waitForDeployment()
  const address = await contract.getAddress()
  console.log('WETH9 deployed at:', address)
  return address
}

async function main() {
  if (!FACTORY_ADDRESS) {
    throw new Error('Please set FACTORY_ADDRESS in your environment.')
  }
  if (!PRIVATE_KEY) {
    throw new Error('Please set PRIVATE_KEY in your environment.')
  }

  const wethAddress = WETH_ADDRESS ? WETH_ADDRESS : await deployWETH()

  await deployRouter(FACTORY_ADDRESS, wethAddress)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
