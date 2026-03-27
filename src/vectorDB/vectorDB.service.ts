import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Index } from '@upstash/vector';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VectorDBService implements OnModuleInit {
  private readonly logger = new Logger(VectorDBService.name);
  private index: Index;

  constructor(private configService: ConfigService) {
    this.index = new Index({
      url: this.configService.get<string>('UPSTASH_VECTOR_REST_URL')!,
      token: this.configService.get<string>('UPSTASH_VECTOR_REST_TOKEN')!,
    });
  }

  async onModuleInit() {
    try {
      const info = await this.index.info();
      this.logger.log(
        `Vector DB connected — dimension: ${info.dimension}, count: ${info.vectorCount}`,
      );
    } catch (error) {
      this.logger.error('Failed to connect to Vector DB', error);
    }
  }

  /**
   * 存储文本及其 metadata 到向量数据库
   * 因为 Upstash Vector 配置了 BGE-M3 内置 embedding，直接传文本即可，无需手动生成向量
   */
  async upsert(
    id: string,
    text: string,
    metadata?: Record<string, unknown>,
  ) {
    await this.index.upsert({
      id,
      data: text,
      metadata,
    });
  }

  /**
   * 批量存储
   */
  async upsertMany(
    items: { id: string; text: string; metadata?: Record<string, unknown> }[],
  ) {
    await this.index.upsert(
      items.map((item) => ({
        id: item.id,
        data: item.text,
        metadata: item.metadata,
      })),
    );
  }

  /**
   * 语义检索：根据查询文本返回最相似的结果
   */
  async query(
    text: string,
    options?: { topK?: number; filter?: string; includeMetadata?: boolean },
  ) {
    const { topK = 5, filter, includeMetadata = true } = options ?? {};

    return this.index.query({
      data: text,
      topK,
      filter,
      includeMetadata,
    });
  }

  /**
   * 根据 id 删除向量
   */
  async delete(ids: string | string[]) {
    await this.index.delete(Array.isArray(ids) ? ids : [ids]);
  }

  /**
   * 获取底层 Index 实例，用于高级操作
   */
  getIndex(): Index {
    return this.index;
  }
}
