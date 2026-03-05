using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Insurance.Application.DTOs.Policy;
using Application.Interfaces;
using AutoMapper;
using Insurance.Domain.Entities;

namespace Application.Services
{
    public class PolicyProductService
    {
        private readonly IPolicyProductRepository _repository;
        private readonly IMapper _mapper;

        public PolicyProductService(
            IPolicyProductRepository repository,
            IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<PolicyProductResponse> CreateAsync(
            CreatePolicyProductRequest dto)
        {
            var product = _mapper.Map<PolicyProduct>(dto);

            await _repository.AddAsync(product);
            await _repository.SaveChangesAsync();

            return _mapper.Map<PolicyProductResponse>(product);
        }

        public async Task<List<PolicyProductResponse>> GetAllAsync()
        {
            var products = await _repository.GetAllAsync();
            return _mapper.Map<List<PolicyProductResponse>>(products);
        }

        public async Task<List<PolicyProductResponse>> GetActiveAsync()
        {
            var products = await _repository.GetActiveAsync();
            return _mapper.Map<List<PolicyProductResponse>>(products);
        }
    }
}
