import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { RealTimeGateWay } from 'src/real-Time/real-Time.gateway';

class MockRealTimeGateWay {}

// A factory function to create a TestModule with the mocked gateway
export function createTestModule(): TestingModuleBuilder {
  return Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(RealTimeGateWay)
    .useClass(MockRealTimeGateWay);
}
